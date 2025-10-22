import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Schedule } from './schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Endpoint } from '../endpoints/endpoint.entity';
import cronParser from 'cron-parser';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule) private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Endpoint) private readonly endpointRepo: Repository<Endpoint>,
  ) {}

  async create(endpointId: string, dto: CreateScheduleDto): Promise<Schedule> {
    const endpoint = await this.endpointRepo.findOne({ where: { id: endpointId } });
    if (!endpoint) throw new NotFoundException('Endpoint no encontrado');
    if (!endpoint.isActive) {
      throw new BadRequestException('No se puede crear schedule para endpoint inactivo');
    }

    if (dto.type === 'CRON' && !dto.cronExpression) {
      throw new BadRequestException('cronExpression requerido para tipo CRON');
    }
    if (dto.type === 'INTERVAL' && !dto.intervalMs) {
      throw new BadRequestException('intervalMs requerido para tipo INTERVAL');
    }

    const nextRunAt = this.computeNextRunAt(dto.type, dto.cronExpression, dto.intervalMs);

    const schedule = this.scheduleRepo.create({
      endpointId,
      type: dto.type,
      cronExpression: dto.cronExpression,
      intervalMs: dto.intervalMs,
      nextRunAt,
      enabled: dto.enabled ?? true,
    });

    return this.scheduleRepo.save(schedule);
  }

  async listByEndpoint(endpointId: string): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: { endpointId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule no encontrado');

    if (dto.type && dto.type !== schedule.type) {
      if (dto.type === 'CRON' && !dto.cronExpression) {
        throw new BadRequestException('cronExpression requerido al cambiar a CRON');
      }
      if (dto.type === 'INTERVAL' && !dto.intervalMs) {
        throw new BadRequestException('intervalMs requerido al cambiar a INTERVAL');
      }
      schedule.type = dto.type;
    }

    if (dto.cronExpression !== undefined) {
      schedule.cronExpression = dto.cronExpression;
    }
    if (dto.intervalMs !== undefined) {
      schedule.intervalMs = dto.intervalMs;
    }
    if (dto.enabled !== undefined) {
      schedule.enabled = dto.enabled;
    }

    if (dto.type || dto.cronExpression !== undefined || dto.intervalMs !== undefined) {
      schedule.nextRunAt = this.computeNextRunAt(
        schedule.type,
        schedule.cronExpression || undefined,
        schedule.intervalMs || undefined,
      );
    }

    return this.scheduleRepo.save(schedule);
  }

  async delete(id: string): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule no encontrado');
    await this.scheduleRepo.remove(schedule);
  }

  async findDue(now: Date): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: {
        enabled: true,
        nextRunAt: LessThanOrEqual(now),
      },
      order: { nextRunAt: 'ASC' },
    });
  }

  async markExecuted(schedule: Schedule, execTime: Date): Promise<void> {
    if (schedule.type === 'CRON') {
      if (!schedule.cronExpression) return;
      const interval = cronParser.parse(schedule.cronExpression, { currentDate: execTime });
      schedule.nextRunAt = interval.next().toDate();
    } else if (schedule.type === 'INTERVAL') {
      if (!schedule.intervalMs) return;
      schedule.nextRunAt = new Date(execTime.getTime() + schedule.intervalMs);
    } else if (schedule.type === 'ONCE') {
      schedule.enabled = false;
      schedule.nextRunAt = execTime;
    }
    schedule.lastRunAt = execTime;
    await this.scheduleRepo.save(schedule);
  }

  private computeNextRunAt(
    type: 'CRON' | 'INTERVAL' | 'ONCE',
    cronExpression?: string,
    intervalMs?: number,
  ): Date {
    const now = new Date();
    if (type === 'CRON') {
      if (!cronExpression) throw new BadRequestException('cronExpression requerido');
      try {
        const interval = cronParser.parse(cronExpression, { currentDate: now });
        return interval.next().toDate();
      } catch {
        throw new BadRequestException('cronExpression inválida');
      }
    }
    if (type === 'INTERVAL') {
      if (!intervalMs || intervalMs < 1) throw new BadRequestException('intervalMs inválido');
      return new Date(now.getTime() + intervalMs);
    }
    return new Date(now.getTime() + 10 * 1000);
  }
}