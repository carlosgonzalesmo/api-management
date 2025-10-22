import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateParameterDto {
  @IsString()
  @IsIn(['PATH', 'QUERY', 'HEADER', 'BODY'])
  location!: 'PATH' | 'QUERY' | 'HEADER' | 'BODY';

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsIn(['string', 'number', 'boolean'])
  dataType!: 'string' | 'number' | 'boolean';

  @IsOptional()
  @IsBoolean()
  required?: boolean = false;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsString()
  exampleValue?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  validationRulesJson?: Record<string, any>;
}