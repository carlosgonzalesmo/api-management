import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchedules1700000002500 implements MigrationInterface {
  name = 'CreateSchedules1700000002500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE schedules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id uuid NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL, -- CRON|INTERVAL|ONCE
        cron_expression TEXT,
        interval_ms BIGINT,
        next_run_at TIMESTAMPTZ NOT NULL,
        last_run_at TIMESTAMPTZ,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sched_due ON schedules(endpoint_id, enabled, next_run_at);
    `);

    // Trigger updated_at (igual estilo que endpoints)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_sched_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_schedules_updated
      BEFORE UPDATE ON schedules
      FOR EACH ROW
      EXECUTE FUNCTION set_sched_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_schedules_updated ON schedules;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_sched_updated_at;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sched_due;`);
    await queryRunner.query(`DROP TABLE IF EXISTS schedules;`);
  }
}