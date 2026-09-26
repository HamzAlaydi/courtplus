import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Mark a venue whose subscription has lapsed.
 *
 * A cancelled or unpaid subscription had no effect at all: the courts stayed
 * listed and bookable, so a vendor could stop paying after month one and keep
 * trading for free. This flag is set automatically when Stripe reports the
 * subscription cancelled or unpaid and cleared the moment it is paid again.
 *
 * Deliberately separate from `blockedAt`, which is an ops decision: the two
 * must not be confused, and paying an invoice must not silently lift an ops
 * ban.
 */
export class TenantSubscriptionLapsed1793000003000
  implements MigrationInterface
{
  name = 'TenantSubscriptionLapsed1793000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionLapsedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tenants_subscription_lapsed" ON "tenants" ("subscriptionLapsedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_tenants_subscription_lapsed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP COLUMN IF EXISTS "subscriptionLapsedAt"`,
    );
  }
}
