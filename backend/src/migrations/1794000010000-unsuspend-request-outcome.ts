import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Record HOW an unsuspend request was resolved.
 *
 * Resolving a request was the only exit from the ops inbox and it always
 * unsuspended the tenant, so a request ops decided against had to be left
 * pending for ever. With an outcome + reason the request can be closed as
 * denied: it leaves the pending list (resolvedAt is set) while the tenant
 * stays suspended and is told why.
 *
 * 'tenant_unsuspend_denied' is the notification that carries that reason.
 * Postgres allows ALTER TYPE ... ADD VALUE inside a transaction (PG 12+) as
 * long as the new value is not used in the same transaction; nothing here
 * writes a notification, so this is safe under migrationsTransactionMode
 * 'each'. Values of UnsuspendRequestOutcome ARE used below, which is allowed
 * because the type is created in this same transaction.
 */
export class UnsuspendRequestOutcome1794000010000 implements MigrationInterface {
  name = 'UnsuspendRequestOutcome1794000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."UnsuspendRequestOutcome" AS ENUM('approved', 'denied')`,
    );
    await queryRunner.query(
      `ALTER TABLE "unsuspend_requests" ADD COLUMN IF NOT EXISTS "outcome" "public"."UnsuspendRequestOutcome"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unsuspend_requests" ADD COLUMN IF NOT EXISTS "resolutionReason" text`,
    );

    // Everything resolved so far went through the approve-only path.
    await queryRunner.query(
      `UPDATE "unsuspend_requests" SET "outcome" = 'approved' WHERE "resolvedAt" IS NOT NULL AND "outcome" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."NotificationType" ADD VALUE IF NOT EXISTS 'tenant_unsuspend_denied'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "unsuspend_requests" DROP COLUMN IF EXISTS "resolutionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "unsuspend_requests" DROP COLUMN IF EXISTS "outcome"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."UnsuspendRequestOutcome"`);
    // Postgres enum values cannot be removed; the notification type stays.
  }
}
