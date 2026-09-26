import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Two fixes that both need schema changes.
 *
 * 1. `tenant_blocked_users` — vendor staff used to block customers through
 *    `PATCH /admin/users/:id/block`, which sets the GLOBAL `users.blockedAt`
 *    and locks the customer out of the entire marketplace. Any vendor could
 *    ban any other vendor's customers. Vendor-side blocking now writes a row
 *    here (one venue only); the global flag stays with SuperAdmin.
 *
 * 2. `tenant_payout_settings.bankName` was NOT NULL with no default, so
 *    starting Stripe Connect onboarding (which inserts a settings row with
 *    only tenantId/provider) failed with a not-null violation AFTER the
 *    Stripe account had been created — a 500 for the vendor and an orphaned
 *    Express account on every retry. Bank details are irrelevant for
 *    Connect-managed payouts, so the column becomes optional.
 */
export class TenantBlockedUsersAndPayoutFixes1793000000000
  implements MigrationInterface
{
  name = 'TenantBlockedUsersAndPayoutFixes1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tenant_blocked_users" (
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "blockedByStaffId" uuid,
        "reason" character varying,
        CONSTRAINT "PK_tenant_blocked_users" PRIMARY KEY ("id"),
        CONSTRAINT "uq_tenant_blocked_user" UNIQUE ("tenantId", "userId"),
        CONSTRAINT "fk_tenant_blocked_users_tenant" FOREIGN KEY ("tenantId")
          REFERENCES "tenants"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_tenant_blocked_users_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tenant_blocked_users_tenantId" ON "tenant_blocked_users" ("tenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tenant_blocked_users_userId" ON "tenant_blocked_users" ("userId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "tenant_payout_settings" ALTER COLUMN "bankName" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rows with a NULL bankName would block the NOT NULL restore; give them a
    // placeholder rather than failing the rollback.
    await queryRunner.query(
      `UPDATE "tenant_payout_settings" SET "bankName" = '' WHERE "bankName" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_payout_settings" ALTER COLUMN "bankName" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_blocked_users"`);
  }
}
