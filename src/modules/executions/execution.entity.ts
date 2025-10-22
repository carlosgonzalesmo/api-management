import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Endpoint } from '../endpoints/endpoint.entity';

export type ExecutionStatus = 'PENDING' | 'SUCCESS' | 'ERROR' | 'TIMEOUT';

@Entity('executions')
export class Execution {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Endpoint, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'endpoint_id' })
    endpoint!: Endpoint;

    @Column({ name: 'endpoint_id' })
    endpointId!: string;

    @Column({ name: 'schedule_id', type: 'uuid', nullable: true })
    scheduleId?: string | null;

    @Column({ name: 'parent_execution_id', type: 'uuid', nullable: true })
    parentExecutionId?: string | null;

    @Column({ name: 'retry_attempt', type: 'int', default: 0 })
    retryAttempt!: number;

    @Column({ name: 'triggered_by', type: 'text' })
    triggeredBy!: 'user' | 'system';

    @Column({ name: 'request_resolved_url', type: 'text' })
    requestResolvedUrl!: string;

    @Column({ name: 'request_method', type: 'varchar', length: 10 })
    requestMethod!: string;

    @Column({ name: 'request_headers_json', type: 'jsonb', nullable: true })
    requestHeadersJson?: Record<string, any> | null;

    @Column({ name: 'request_body_json', type: 'jsonb', nullable: true })
    requestBodyJson?: any | null;

    @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
    startedAt?: Date | null;

    @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
    finishedAt?: Date | null;

    @Column({ name: 'duration_ms', type: 'int', nullable: true })
    durationMs?: number | null;

    @Column({ type: 'varchar', length: 20 })
    status!: ExecutionStatus;

    @Column({ name: 'http_status_code', type: 'int', nullable: true })
    httpStatusCode?: number | null;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage?: string | null;

    @Column({ name: 'response_headers_json', type: 'jsonb', nullable: true })
    responseHeadersJson?: Record<string, any> | null;

    @Column({ name: 'response_body_json', type: 'jsonb', nullable: true })
    responseBodyJson?: any | null;

    @Column({ name: 'response_truncated', type: 'boolean', default: false })
    responseTruncated!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}