import { PartialType } from '@nestjs/mapped-types';
import { CreateEndpointDto } from './create-endpoint.dto';
import { IsInt, IsOptional, Min, Max, IsIn, IsString, IsBoolean, IsObject } from 'class-validator';

export class UpdateEndpointDto extends PartialType(CreateEndpointDto) {
  // Aquí podrías reforzar reglas específicas si difieren.
  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  retryMaxAttempts?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  retryDelayMs?: number;

  @IsOptional()
  @IsString()
  @IsIn(['NONE', 'BEARER'])
  authType?: string;

  @IsOptional()
  @IsString()
  authBearerToken?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  headersJson?: Record<string, any>;

  @IsOptional()
  @IsObject()
  bodyTemplateJson?: Record<string, any>;
}