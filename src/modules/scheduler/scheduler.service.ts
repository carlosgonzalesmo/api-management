import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SchedulesService } from '../schedules/schedules.service';
import { ExecutionsService } from '../executions/executions.service';

@Injectable()
export class InternalSchedulerService {
    private readonly logger = new Logger(InternalSchedulerService.name);
    private readonly isScheduler: boolean;

    constructor(
        private readonly config: ConfigService,
        private readonly schedulesService: SchedulesService,
        private readonly executionsService: ExecutionsService,
    ) {
        this.isScheduler = this.config.get<boolean>('isScheduler', true);
    }

    // Corre cada minuto (puedes usar la expresión de ENV si quieres)
    @Cron('*/1 * * * *')
    async tick() {
        if (!this.isScheduler) {
            return;
        }
        const now = new Date();
        try {
            const due = await this.schedulesService.findDue(now);
            if (due.length === 0) return;

            this.logger.log(`Encontrados ${due.length} schedules vencidos`);

            for (const sched of due) {
                // Ejecutar endpoint
                const exec = await this.executionsService.executeFromScheduler(sched.endpointId, sched.id);
                // Actualizar schedule (calcular nextRunAt o deshabilitar ONCE)
                await this.schedulesService.markExecuted(sched, new Date());
                this.logger.log(
                    `Schedule ${sched.id} ejecutado -> ejecución ${exec?.id || '(endpoint inactivo)'}`,
                );
            }
        } catch (err) {
            this.logger.error(`Error en scheduler: ${(err as Error).message}`);
        }
    }
}