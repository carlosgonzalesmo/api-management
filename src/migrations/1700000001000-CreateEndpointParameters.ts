import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEndpointParameters1700000001000 implements MigrationInterface {
  name = 'CreateEndpointParameters1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryRunner.query(`
      CREATE TABLE endpoint_parameters (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id uuid NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
        location VARCHAR(20) NOT NULL,
        name TEXT NOT NULL,
        data_type VARCHAR(20) NOT NULL,
        required BOOLEAN NOT NULL DEFAULT FALSE,
        default_value TEXT,
        example_value TEXT,
        description TEXT,
        validation_rules_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_endpoint_parameters_endpoint ON endpoint_parameters(endpoint_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_endpoint_parameters_endpoint;`);
    await queryRunner.query(`DROP TABLE IF EXISTS endpoint_parameters;`);
  }
}