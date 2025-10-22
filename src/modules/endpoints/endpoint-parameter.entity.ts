import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { Endpoint } from './endpoint.entity';

@Entity('endpoint_parameters')
export class EndpointParameter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Endpoint, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'endpoint_id' })
  endpoint!: Endpoint;

  @Column({ name: 'endpoint_id' })
  endpointId!: string;

  @Column({ type: 'varchar', length: 20 })
  location!: 'PATH' | 'QUERY' | 'HEADER' | 'BODY';

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'data_type', type: 'varchar', length: 20 })
  dataType!: 'string' | 'number' | 'boolean';

  @Column({ name: 'required', type: 'boolean', default: false })
  required!: boolean;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue?: string | null;

  @Column({ name: 'example_value', type: 'text', nullable: true })
  exampleValue?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'validation_rules_json', type: 'jsonb', nullable: true })
  validationRulesJson?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}