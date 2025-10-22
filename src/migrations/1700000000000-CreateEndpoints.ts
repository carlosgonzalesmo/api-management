import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEndpoints1700000000000 implements MigrationInterface {
  name = 'CreateEndpoints1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`
      CREATE TABLE endpoints (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        method VARCHAR(10) NOT NULL,
        base_url TEXT NOT NULL,
        path TEXT NOT NULL,
        timeout_ms INT NOT NULL DEFAULT 10000,
        headers_json JSONB,
        body_template_json JSONB,
        auth_type VARCHAR(20) NOT NULL DEFAULT 'NONE',
        auth_bearer_token TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        retry_max_attempts INT NOT NULL DEFAULT 0,
        retry_delay_ms INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_endpoints_updated
      BEFORE UPDATE ON endpoints
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_endpoints_updated ON endpoints;`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at;`);
    await queryRunner.query(`DROP TABLE IF EXISTS endpoints;`);
  }
}