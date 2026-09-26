import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A payout that the provider rejects had no notification type, so there was
 * no row to write and the vendor was told nothing at all: the money silently
 * reappeared on their balance and they retried into the same failure.
 *
 * Same style as the other enum migrations: ADD VALUE IF NOT EXISTS, which
 * Postgres 12+ permits inside a transaction as long as the value is not used
 * in that same transaction (nothing here writes a notification).
 */
export class PayoutFailedNotificationType1794000013000
  implements MigrationInterface
{
  name = 'PayoutFailedNotificationType1794000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'payout_failed'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres enum values cannot be removed; documented no-op.
  }
}
