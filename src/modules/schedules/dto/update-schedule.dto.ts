import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateScheduleDto {
  @IsOptional()
  @IsString()
  @IsIn(['CRON', 'INTERVAL', 'ONCE'])
  type?: 'CRON' | 'INTERVAL' | 'ONCE';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cronExpression?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMs?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}