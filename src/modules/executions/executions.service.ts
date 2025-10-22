import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from './execution.entity';
import { Endpoint } from '../endpoints/endpoint.entity';
import { EndpointParameter } from '../endpoints/endpoint-parameter.entity';
import { ExecuteEndpointDto } from './dto/execute-endpoint.dto';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

type ParamLocation = 'PATH' | 'QUERY' | 'HEADER' | 'BODY';

@Injectable()
export class ExecutionsService {
    private readonly maxBytes: number;
    private readonly defaultTimeoutMs: number;

    constructor(
        @InjectRepository(Execution) private readonly execRepo: Repository<Execution>,
        @InjectRepository(Endpoint) private readonly endpointRepo: Repository<Endpoint>,
        @InjectRepository(EndpointParameter) private readonly paramRepo: Repository<EndpointParameter>,
        private readonly config: ConfigService,
    ) {
        this.maxBytes = this.config.get<number>('responseBodyMaxBytes', 262144);
        this.defaultTimeoutMs = this.config.get<number>('defaultTimeoutMs', 10000);
    }

    async executeManual(endpointId: string, dto: ExecuteEndpointDto) {
        const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId } });
        if (!endpoint) throw new NotFoundException('Endpoint no encontrado');
        if (!endpoint.isActive) {
            throw new BadRequestException('Endpoint inactivo: no se puede ejecutar');
        }

        const params = await this.paramRepo.find({ where: { endpointId }, order: { createdAt: 'ASC' } });
        const input = dto.overrides || {};

        const resolved = this.resolveParameters(params, input);

        // Construcción de URL
        const base = endpoint.baseUrl.replace(/\/+$/, '');
        const path = this.applyPath(endpoint.path, resolved.pathParams);
        const query = this.buildQuery(resolved.queryParams);
        const resolvedUrl = `${base}${path}${query ? `?${query}` : ''}`;

        // Headers
        const headers: Record<string, any> = {
            ...(endpoint.headersJson || {}),
            ...resolved.headerParams,
        };
        if (endpoint.authType === 'BEARER' && endpoint.authBearerToken) {
            headers['Authorization'] = `Bearer ${endpoint.authBearerToken}`;
        }

        // Body (solo para POST/PUT/PATCH)
        let body: any = undefined;
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
            body = { ...(endpoint.bodyTemplateJson || {}) };
            Object.assign(body, resolved.bodyParams);
        }

        // Crear ejecución PENDING
        const pending = this.execRepo.create({
            endpointId,
            scheduleId: null,
            parentExecutionId: null,
            retryAttempt: 0,
            triggeredBy: 'user',
            requestResolvedUrl: resolvedUrl,
            requestMethod: endpoint.method.toUpperCase(),
            requestHeadersJson: headers,
            requestBodyJson: body ?? null,
            status: 'PENDING',
            responseTruncated: false,
        });
        const saved = await this.execRepo.save(pending);

        // Ejecutar HTTP
        const startedAt = new Date();
        let finishedAt: Date | null = null;
        let durationMs: number | null = null;
        let status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'ERROR';
        let httpStatusCode: number | null = null;
        let errorMessage: string | null = null;
        let responseHeaders: any = null;
        let responseBody: any = null;
        let responseTruncated = false;

        try {
            const timeout = endpoint.timeoutMs ?? this.defaultTimeoutMs;
            const resp = await axios.request({
                method: endpoint.method as any,
                url: resolvedUrl,
                headers,
                data: body,
                timeout,
                validateStatus: () => true, // no lanzar por códigos 4xx/5xx
            });

            finishedAt = new Date();
            durationMs = finishedAt.getTime() - startedAt.getTime();
            httpStatusCode = resp.status;
            responseHeaders = resp.headers;

            // Normalizar body a string/objeto JSON según content-type
            const data = resp.data;
            const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
            const buf = Buffer.from(payloadStr ?? '', 'utf8');
            if (buf.length > this.maxBytes) {
                responseTruncated = true;
                const truncatedStr = buf.subarray(0, this.maxBytes).toString('utf8');
                try {
                    responseBody = JSON.parse(truncatedStr);
                } catch {
                    responseBody = truncatedStr;
                }
            } else {
                responseBody = data;
            }

            status = 'SUCCESS';
        } catch (err) {
            finishedAt = new Date();
            durationMs = finishedAt.getTime() - startedAt.getTime();

            const ax = err as AxiosError;
            if ((ax as any).code === 'ECONNABORTED') {
                status = 'TIMEOUT';
                errorMessage = `Timeout tras ${endpoint.timeoutMs ?? this.defaultTimeoutMs}ms`;
            } else {
                status = 'ERROR';
                errorMessage = ax.message;
                // Si hay respuesta, guardamos lo que se pueda
                if (ax.response) {
                    httpStatusCode = ax.response.status;
                    responseHeaders = ax.response.headers;
                    const data = ax.response.data;
                    const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
                    const buf = Buffer.from(payloadStr ?? '', 'utf8');
                    if (buf.length > this.maxBytes) {
                        responseTruncated = true;
                        const truncatedStr = buf.subarray(0, this.maxBytes).toString('utf8');
                        try {
                            responseBody = JSON.parse(truncatedStr);
                        } catch {
                            responseBody = truncatedStr;
                        }
                    } else {
                        responseBody = data;
                    }
                }
            }
        }

        // Actualizar ejecución con resultado
        await this.execRepo.update(
            { id: saved.id },
            {
                startedAt,
                finishedAt,
                durationMs: durationMs ?? null,
                status,
                httpStatusCode,
                errorMessage,
                responseHeadersJson: responseHeaders,
                responseBodyJson: responseBody,
                responseTruncated,
            },
        );

        // Devolvemos la fila ya actualizada
        return this.execRepo.findOneOrFail({ where: { id: saved.id } });
    }

    private resolveParameters(
        params: EndpointParameter[],
        overrides: Record<string, any>,
    ) {
        const pathParams: Record<string, string> = {};
        const queryParams: Record<string, string> = {};
        const headerParams: Record<string, string> = {};
        const bodyParams: Record<string, any> = {};

        for (const p of params) {
            // obtener valor: override > defaultValue
            let value: any =
                overrides[p.name] !== undefined ? overrides[p.name] : p.defaultValue;

            if (p.required && (value === undefined || value === null || value === '')) {
                throw new BadRequestException(
                    `Parámetro requerido faltante: ${p.location}.${p.name}`,
                );
            }

            if (value !== undefined && value !== null) {
                value = this.coerce(value, p.dataType, p.name);
            }

            switch (p.location as ParamLocation) {
                case 'PATH':
                    if (value === undefined || value === null) break;
                    pathParams[p.name] = String(value);
                    break;
                case 'QUERY':
                    if (value === undefined || value === null) break;
                    queryParams[p.name] = String(value);
                    break;
                case 'HEADER':
                    if (value === undefined || value === null) break;
                    headerParams[p.name] = String(value);
                    break;
                case 'BODY':
                    if (value === undefined || value === null) break;
                    bodyParams[p.name] = value;
                    break;
            }
        }

        return { pathParams, queryParams, headerParams, bodyParams };
    }

    private coerce(value: any, dataType: 'string' | 'number' | 'boolean', name: string) {
        if (dataType === 'string') return String(value);
        if (dataType === 'number') {
            const n = typeof value === 'number' ? value : parseFloat(String(value));
            if (Number.isNaN(n)) {
                throw new BadRequestException(`El parámetro ${name} debe ser número`);
            }
            return n;
        }
        if (dataType === 'boolean') {
            const v = String(value).toLowerCase();
            if (v === 'true' || v === '1') return true;
            if (v === 'false' || v === '0') return false;
            throw new BadRequestException(`El parámetro ${name} debe ser booleano (true/false/1/0)`);
        }
        return value;
    }

    private applyPath(path: string, pathParams: Record<string, string>) {
        let result = path;
        const missing: string[] = [];
        // Reemplaza {param}
        result = result.replace(/\{([^}]+)\}/g, (_, key: string) => {
            if (pathParams[key] === undefined) {
                missing.push(key);
                return `{${key}}`;
            }
            // encodeURIComponent para seguridad
            return encodeURIComponent(pathParams[key]);
        });
        if (missing.length > 0) {
            throw new BadRequestException(`Faltan parámetros PATH: ${missing.join(', ')}`);
        }
        // Asegurar que comience con '/'
        if (!result.startsWith('/')) result = `/${result}`;
        return result;
    }

    private buildQuery(queryParams: Record<string, string>) {
        const entries = Object.entries(queryParams);
        if (entries.length === 0) return '';
        return entries
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
    }
    // Añadir este nuevo método dentro de la clase ExecutionsService
    async executeFromScheduler(endpointId: string, scheduleId: string) {
        // Llamamos a executeManual pero ajustando triggeredBy y guardando scheduleId.
        const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId } });
        if (!endpoint) throw new NotFoundException('Endpoint no encontrado');
        if (!endpoint.isActive) {
            // Si el endpoint está inactivo, simplemente no ejecutar.
            return null;
        }

        // Reutilizamos la menor cantidad de lógica. Para simplicidad, haremos una versión simplificada que NO admite overrides.
        const params = await this.paramRepo.find({ where: { endpointId }, order: { createdAt: 'ASC' } });
        const resolved = this.resolveParameters(params, {}); // defaults

        const base = endpoint.baseUrl.replace(/\/+$/, '');
        const path = this.applyPath(endpoint.path, resolved.pathParams);
        const query = this.buildQuery(resolved.queryParams);
        const resolvedUrl = `${base}${path}${query ? `?${query}` : ''}`;

        const headers: Record<string, any> = {
            ...(endpoint.headersJson || {}),
            ...resolved.headerParams,
        };
        if (endpoint.authType === 'BEARER' && endpoint.authBearerToken) {
            headers['Authorization'] = `Bearer ${endpoint.authBearerToken}`;
        }

        let body: any = undefined;
        if (['POST', 'PUT', 'PATCH'].includes(endpoint.method.toUpperCase())) {
            body = { ...(endpoint.bodyTemplateJson || {}) };
            Object.assign(body, resolved.bodyParams);
        }

        // Crear ejecución PENDING
        const pending = this.execRepo.create({
            endpointId,
            scheduleId,
            parentExecutionId: null,
            retryAttempt: 0,
            triggeredBy: 'system',
            requestResolvedUrl: resolvedUrl,
            requestMethod: endpoint.method.toUpperCase(),
            requestHeadersJson: headers,
            requestBodyJson: body ?? null,
            status: 'PENDING',
            responseTruncated: false,
        });
        const saved = await this.execRepo.save(pending);

        // Reutilizamos parte del bloque de ejecución (podrías refactorizar para no repetir, pero para claridad lo dejamos)
        const startedAt = new Date();
        let finishedAt: Date | null = null;
        let durationMs: number | null = null;
        let status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' = 'ERROR';
        let httpStatusCode: number | null = null;
        let errorMessage: string | null = null;
        let responseHeaders: any = null;
        let responseBody: any = null;
        let responseTruncated = false;

        try {
            const timeout = endpoint.timeoutMs ?? this.defaultTimeoutMs;
            const resp = await axios.request({
                method: endpoint.method as any,
                url: resolvedUrl,
                headers,
                data: body,
                timeout,
                validateStatus: () => true,
            });

            finishedAt = new Date();
            durationMs = finishedAt.getTime() - startedAt.getTime();
            httpStatusCode = resp.status;
            responseHeaders = resp.headers;

            const data = resp.data;
            const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
            const buf = Buffer.from(payloadStr ?? '', 'utf8');
            if (buf.length > this.maxBytes) {
                responseTruncated = true;
                const truncatedStr = buf.subarray(0, this.maxBytes).toString('utf8');
                try {
                    responseBody = JSON.parse(truncatedStr);
                } catch {
                    responseBody = truncatedStr;
                }
            } else {
                responseBody = data;
            }

            status = 'SUCCESS';
        } catch (err) {
            finishedAt = new Date();
            durationMs = finishedAt.getTime() - startedAt.getTime();
            const ax = err as any;
            if (ax.code === 'ECONNABORTED') {
                status = 'TIMEOUT';
                errorMessage = `Timeout tras ${endpoint.timeoutMs ?? this.defaultTimeoutMs}ms`;
            } else {
                status = 'ERROR';
                errorMessage = ax.message;
                if (ax.response) {
                    httpStatusCode = ax.response.status;
                    responseHeaders = ax.response.headers;
                    const data = ax.response.data;
                    const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
                    const buf = Buffer.from(payloadStr ?? '', 'utf8');
                    if (buf.length > this.maxBytes) {
                        responseTruncated = true;
                        const truncatedStr = buf.subarray(0, this.maxBytes).toString('utf8');
                        try {
                            responseBody = JSON.parse(truncatedStr);
                        } catch {
                            responseBody = truncatedStr;
                        }
                    } else {
                        responseBody = data;
                    }
                }
            }
        }

        await this.execRepo.update(
            { id: saved.id },
            {
                startedAt,
                finishedAt,
                durationMs,
                status,
                httpStatusCode,
                errorMessage,
                responseHeadersJson: responseHeaders,
                responseBodyJson: responseBody,
                responseTruncated,
            },
        );

        return this.execRepo.findOne({ where: { id: saved.id } });
    }
}