import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Three production-integrity fixes that must land together.
 *
 * 1. MONEY PRECISION — tenant_balances and balance_transactions stored money as
 *    `double precision`. Binary floating point cannot represent 0.10 exactly, so
 *    every `balance += net` accumulated drift, the `balance < amount` guard in
 *    the payout path became unreliable at the boundary, and the transaction
 *    ledger could never be reconciled exactly against the stored balance.
 *    Payment.amount and Booking.totalAmount were already numeric(10,2); this
 *    brings the ledger in line.
 *
 * 2. ONE BALANCE PER TENANT — tenant_balances had no unique constraint on
 *    tenantId while BalanceService.getBalance() is a get-or-create. Two
 *    concurrent first-writes could split a tenant's money across two rows,
 *    permanently hiding part of their earnings.
 *
 * 3. NO DOUBLE BOOKING — slot_reservations had only a plain, non-unique index.
 *    reserveSlot() did `SELECT ... FOR UPDATE` then INSERT, but FOR UPDATE locks
 *    matching rows and a free slot matches zero rows, so it took no lock at all:
 *    two concurrent bookers both saw "free" and both inserted. An exclusion
 *    constraint is the only way to make overlap impossible under concurrency.
 */
export class MoneyPrecisionAndBookingIntegrity1790000000000
  implements MigrationInterface
{
  name = 'MoneyPrecisionAndBookingIntegrity1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Money precision -------------------------------------------------
    // numeric(14,2) holds ~999 billion major units, far beyond any realistic
    // tenant balance, while remaining exact.
    await queryRunner.query(`
      ALTER TABLE "tenant_balances"
        ALTER COLUMN "availableBalance" TYPE numeric(14,2) USING ROUND("availableBalance"::numeric, 2),
        ALTER COLUMN "pendingBalance"   TYPE numeric(14,2) USING ROUND("pendingBalance"::numeric, 2),
        ALTER COLUMN "totalEarnings"    TYPE numeric(14,2) USING ROUND("totalEarnings"::numeric, 2)
    `);
    await queryRunner.query(`
      ALTER TABLE "balance_transactions"
        ALTER COLUMN "amount" TYPE numeric(14,2) USING ROUND("amount"::numeric, 2)
    `);

    // --- 2. One balance row per tenant -------------------------------------
    // Fold any duplicate rows into the earliest one before adding the
    // constraint, so the migration cannot fail on existing data.
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, "tenantId",
               ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt") AS rn
        FROM "tenant_balances"
      ),
      keeper AS (SELECT "tenantId", id FROM ranked WHERE rn = 1),
      totals AS (
        SELECT tb."tenantId",
               SUM(tb."availableBalance") AS available,
               SUM(tb."pendingBalance")   AS pending,
               SUM(tb."totalEarnings")    AS earnings
        FROM "tenant_balances" tb
        GROUP BY tb."tenantId"
      )
      UPDATE "tenant_balances" tb
      SET "availableBalance" = t.available,
          "pendingBalance"   = t.pending,
          "totalEarnings"    = t.earnings
      FROM keeper k
      JOIN totals t ON t."tenantId" = k."tenantId"
      WHERE tb.id = k.id
    `);
    await queryRunner.query(`
      DELETE FROM "tenant_balances" tb
      USING (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt") AS rn
        FROM "tenant_balances"
      ) ranked
      WHERE tb.id = ranked.id AND ranked.rn > 1
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_balances"
        ADD CONSTRAINT "uq_tenant_balances_tenantId" UNIQUE ("tenantId")
    `);

    // --- 3. Overlap-proof slot reservations --------------------------------
    // btree_gist lets an EXCLUDE constraint mix an equality test on a uuid with
    // an overlap test on a time range.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    // Clear expired holds, then drop any surviving overlaps, so the constraint
    // can be created against existing data.
    await queryRunner.query(`
      DELETE FROM "slot_reservations" WHERE "expiresAt" <= now()
    `);
    await queryRunner.query(`
      DELETE FROM "slot_reservations" a
      USING "slot_reservations" b
      WHERE a."courtId" = b."courtId"
        AND a.id <> b.id
        AND tstzrange(a."startDate", a."endDate", '[)') && tstzrange(b."startDate", b."endDate", '[)')
        AND a."createdAt" > b."createdAt"
    `);

    // No WHERE predicate: Postgres requires index predicates to be IMMUTABLE
    // and now() is only STABLE, so `WHERE expiresAt > now()` is rejected
    // outright (42P17). The constraint therefore covers every row, which is
    // safe because SlotsService.reserveSlot() calls cleanupExpiredReservations()
    // before inserting — expired holds are deleted, not left to block a slot.
    await queryRunner.query(`
      ALTER TABLE "slot_reservations"
        ADD CONSTRAINT "excl_slot_reservation_overlap"
        EXCLUDE USING gist (
          "courtId" WITH =,
          tstzrange("startDate", "endDate", '[)') WITH &&
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "slot_reservations"
        DROP CONSTRAINT IF EXISTS "excl_slot_reservation_overlap"
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_balances"
        DROP CONSTRAINT IF EXISTS "uq_tenant_balances_tenantId"
    `);
    await queryRunner.query(`
      ALTER TABLE "balance_transactions"
        ALTER COLUMN "amount" TYPE double precision USING "amount"::double precision
    `);
    await queryRunner.query(`
      ALTER TABLE "tenant_balances"
        ALTER COLUMN "availableBalance" TYPE double precision USING "availableBalance"::double precision,
        ALTER COLUMN "pendingBalance"   TYPE double precision USING "pendingBalance"::double precision,
        ALTER COLUMN "totalEarnings"    TYPE double precision USING "totalEarnings"::double precision
    `);
  }
}
