import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Endpoint } from '../endpoints/endpoint.entity';

export type ScheduleType = 'CRON' | 'INTERVAL' | 'ONCE';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Endpoint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'endpoint_id' })
  endpoint!: Endpoint;

  @Column({ name: 'endpoint_id' })
  endpointId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: ScheduleType;

  @Column({ name: 'cron_expression', type: 'text', nullable: true })
  cronExpression?: string | null;

  @Column({ name: 'interval_ms', type: 'bigint', nullable: true })
  intervalMs?: number | null;

  @Column({ name: 'next_run_at', type: 'timestamptz' })
  nextRunAt!: Date;

  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt?: Date | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}