import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('endpoints')
export class Endpoint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'varchar', length: 10 })
  method!: string; // GET|POST|PUT|PATCH|DELETE

  @Column({ name: 'base_url', type: 'text' })
  baseUrl!: string;

  @Column({ type: 'text' })
  path!: string; // puede contener placeholders {id}

  @Column({ name: 'timeout_ms', type: 'int', default: 10000 })
  timeoutMs!: number;

  @Column({ name: 'headers_json', type: 'jsonb', nullable: true })
  headersJson?: Record<string, any>;

  @Column({ name: 'body_template_json', type: 'jsonb', nullable: true })
  bodyTemplateJson?: Record<string, any>;

  @Column({ name: 'auth_type', type: 'varchar', length: 20, default: 'NONE' })
  authType!: string; // NONE | BEARER

  @Column({ name: 'auth_bearer_token', type: 'text', nullable: true })
  authBearerToken?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'retry_max_attempts', type: 'int', default: 0 })
  retryMaxAttempts!: number;

  @Column({ name: 'retry_delay_ms', type: 'int', default: 0 })
  retryDelayMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}