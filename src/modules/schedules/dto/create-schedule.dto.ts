import { IsIn, IsNotEmpty, IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsIn(['CRON', 'INTERVAL', 'ONCE'])
  type!: 'CRON' | 'INTERVAL' | 'ONCE';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cronExpression?: string; // requerido si type=CRON

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMs?: number; // requerido si type=INTERVAL (milisegundos)

  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;

  // Para ONCE, puedes permitir campo nextRunAt futuro (opcional). Lo omitimos por simplicidad:
  // El nextRunAt se calculará ahora + 1 minuto si no se provee.
}