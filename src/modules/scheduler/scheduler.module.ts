import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InternalSchedulerService } from './scheduler.service';
import { SchedulesModule } from '../schedules/schedules.module';
import { ExecutionsModule } from '../executions/executions.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SchedulesModule,
    ExecutionsModule,
  ],
  providers: [InternalSchedulerService],
})
export class SchedulerInfraModule {}