import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The audit log's "LogEntity" enum had no 'payout' value, so approving,
 * rejecting or marking a vendor payout as sent could not be written to the
 * logs table at all - those money-moving actions left no trace.
 */
export class PayoutAuditEntity1793000001000 implements MigrationInterface {
  name = 'PayoutAuditEntity1793000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."LogEntity" ADD VALUE IF NOT EXISTS 'payout'`);
  }

  public async down(): Promise<void> {
    // Postgres enum values cannot be removed; no-op.
  }
}
