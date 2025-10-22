import { IsObject, IsOptional } from 'class-validator';

export class ExecuteEndpointDto {
  @IsOptional()
  @IsObject()
  overrides?: Record<string, any>;
}