import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers['x-api-key'];
    const expected = this.config.get<string>('apiKey');
    if (!expected) {
      throw new UnauthorizedException('API key no configurada en el servidor');
    }
    if (!headerKey || headerKey !== expected) {
      throw new UnauthorizedException('API key inválida o ausente');
    }
    return true;
  }
}