import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInfoSeverity1732636000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'info' to the rules_severity_enum
    await queryRunner.query(`
      ALTER TYPE rules_severity_enum ADD VALUE IF NOT EXISTS 'info';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // You would need to recreate the enum type if you want to remove 'info'
    // For now, we'll leave this as a no-op since removing enum values is complex
    console.warn('Downgrade not supported: Cannot remove enum values in PostgreSQL');
  }
}
