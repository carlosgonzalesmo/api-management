import { plainToInstance } from 'class-transformer';
import { IsString, IsOptional, IsNumberString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsNumberString()
  PORT!: string;

  @IsString()
  API_KEY!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsOptional()
  @IsString()
  RESPONSE_BODY_MAX_BYTES?: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    console.error(errors);
    throw new Error('Configuración .env inválida');
  }
  return config;
}