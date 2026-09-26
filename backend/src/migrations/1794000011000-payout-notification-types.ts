import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Payouts had no notification types at all: ops never learned that a vendor
 * had requested one, and the vendor never heard that it was approved,
 * rejected or actually sent — the only trace was a status in a table nobody
 * was watching. Adding the enum values here so the notification rows can be
 * written; without them every insert fails with "invalid input value for
 * enum NotificationType".
 *
 * Same style as the other enum migrations: ADD VALUE IF NOT EXISTS, which
 * Postgres 12+ permits inside a transaction as long as the value is not used
 * in that same transaction (nothing here writes a notification).
 */
export class PayoutNotificationTypes1794000011000 implements MigrationInterface {
  name = 'PayoutNotificationTypes1794000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'payout_requested'`);
    await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'payout_approved'`);
    await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'payout_rejected'`);
    await queryRunner.query(`ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'payout_completed'`);
  }

  public async down(): Promise<void> {
    // Postgres enum values cannot be removed; documented no-op.
  }
}
