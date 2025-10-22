import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateEndpointDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  method!: string;

  @IsString()
  @IsNotEmpty()
  baseUrl!: string;

  @IsString()
  @IsNotEmpty()
  path!: string; // Puede contener {id}

  @IsOptional()
  @IsObject()
  headersJson?: Record<string, any>;

  @IsOptional()
  @IsObject()
  bodyTemplateJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'BEARER'])
  authType?: string = 'NONE';

  @IsOptional()
  @IsString()
  authBearerToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  retryMaxAttempts?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(0)
  retryDelayMs?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number = 10000;
}