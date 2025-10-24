// Tipos derivados de entidades backend para consumo en el frontend.
// Mantener sincronizado si cambian las entidades en NestJS.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type AuthType = 'NONE' | 'BEARER';

export interface Endpoint {
  id: string;
  name: string;
  method: HttpMethod | string; // permitir flexibilidad si backend agrega más
  baseUrl: string;
  path: string;
  timeoutMs: number;
  headersJson?: Record<string, any> | null;
  bodyTemplateJson?: Record<string, any> | null;
  authType: AuthType | string;
  authBearerToken?: string | null;
  isActive: boolean;
  retryMaxAttempts: number;
  retryDelayMs: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ParameterLocation = 'PATH' | 'QUERY' | 'HEADER' | 'BODY';
export type ParameterDataType = 'string' | 'number' | 'boolean';

export interface EndpointParameter {
  id: string;
  endpointId: string;
  location: ParameterLocation;
  name: string;
  dataType: ParameterDataType;
  required: boolean;
  defaultValue?: string | null;
  exampleValue?: string | null;
  description?: string | null;
  validationRulesJson?: Record<string, any> | null;
  createdAt: string;
}

export type ScheduleType = 'CRON' | 'INTERVAL' | 'ONCE';

export interface Schedule {
  id: string;
  endpointId: string;
  type: ScheduleType;
  cronExpression?: string | null;
  intervalMs?: number | null;
  nextRunAt: string;
  lastRunAt?: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExecutionStatus = 'PENDING' | 'SUCCESS' | 'ERROR' | 'TIMEOUT';

export interface Execution {
  id: string;
  endpointId: string;
  scheduleId?: string | null;
  parentExecutionId?: string | null;
  retryAttempt: number;
  triggeredBy: 'user' | 'system';
  requestResolvedUrl: string;
  requestMethod: HttpMethod | string;
  requestHeadersJson?: Record<string, any> | null;
  requestBodyJson?: any | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  status: ExecutionStatus;
  httpStatusCode?: number | null;
  errorMessage?: string | null;
  responseHeadersJson?: Record<string, any> | null;
  responseBodyJson?: any | null;
  responseTruncated: boolean;
  createdAt: string;
}

// Payloads para creación/actualización frontend
export interface CreateEndpointPayload {
  name: string;
  method: HttpMethod | string;
  baseUrl: string;
  path: string;
  timeoutMs?: number;
  headersJson?: Record<string, any> | null;
  bodyTemplateJson?: Record<string, any> | null;
  authType?: AuthType | string;
  authBearerToken?: string | null;
  isActive?: boolean;
  retryMaxAttempts?: number;
  retryDelayMs?: number;
}

export interface UpdateEndpointPayload extends Partial<CreateEndpointPayload> {}

export interface CreateParameterPayload {
  location: ParameterLocation;
  name: string;
  dataType: ParameterDataType;
  required?: boolean;
  defaultValue?: string | null;
  exampleValue?: string | null;
  description?: string | null;
  validationRulesJson?: Record<string, any> | null;
}

export interface CreateSchedulePayload {
  type: ScheduleType;
  cronExpression?: string | null;
  intervalMs?: number | null;
  nextRunAt?: string | null; // backend podría ignorar si calcula automáticamente
}

export interface ExecuteEndpointPayload {
  overrides?: Record<string, any>;
}
