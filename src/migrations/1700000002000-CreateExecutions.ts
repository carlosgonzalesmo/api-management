import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExecutions1700000002000 implements MigrationInterface {
  name = 'CreateExecutions1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE executions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id uuid NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
        schedule_id uuid,
        parent_execution_id uuid REFERENCES executions(id) ON DELETE SET NULL,
        retry_attempt INT NOT NULL DEFAULT 0,
        triggered_by TEXT NOT NULL,
        request_resolved_url TEXT NOT NULL,
        request_method VARCHAR(10) NOT NULL,
        request_headers_json JSONB,
        request_body_json JSONB,
        started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        duration_ms INT,
        status VARCHAR(20) NOT NULL,
        http_status_code INT,
        error_message TEXT,
        response_headers_json JSONB,
        response_body_json JSONB,
        response_truncated BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_exec_endpoint_created ON executions(endpoint_id, created_at DESC);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_exec_parent ON executions(parent_execution_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exec_parent;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exec_endpoint_created;`);
    await queryRunner.query(`DROP TABLE IF EXISTS executions;`);
  }
}