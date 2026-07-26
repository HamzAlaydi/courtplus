import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Backfills denormalized counters for payments captured BEFORE the per-payment
 * events (PAYMENT_CAPTURED / PAYMENT_REFUNDED and the CREATED-based
 * bookingsCount listener) were deployed.
 *
 * - Revenue counters (users.totalSpent, courts/branches/tenants.totalRevenue)
 *   are ADDITIVE and only include payments created before CUTOFF, because
 *   captures after the deploy are already reflected by the event listeners.
 *   Refunded payments contribute 0 naturally: refund() flips their status to
 *   'refunded', so the status = 'completed' filter excludes them.
 *   NOT re-runnable-safe: running the revenue updates twice would double-add
 *   (migrations run once, so this is acceptable).
 * - users.bookingsCount is a SET to the live count of non-cancelled bookings
 *   per creator (bookings."userId"), matching the creator-only CREATED
 *   listener semantics. This one IS idempotent.
 */
export class BackfillPaymentCounters1785052800000 implements MigrationInterface {
    name = 'BackfillPaymentCounters1785052800000'

    // Payments created before this timestamp are not yet reflected in the
    // counters; later ones were counted by the per-payment event listeners.
    private static readonly CUTOFF = '2026-07-26 04:00:00+00';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const cutoff = BackfillPaymentCounters1785052800000.CUTOFF;

        // users.totalSpent += sum of their captured payments
        await queryRunner.query(`
            UPDATE "users" u
            SET "totalSpent" = COALESCE(u."totalSpent", 0) + agg.total
            FROM (
                SELECT p."userId" AS "userId", SUM(p.amount) AS total
                FROM "payments" p
                WHERE p.status = 'completed' AND p."createdAt" < '${cutoff}'
                GROUP BY p."userId"
            ) agg
            WHERE u.id = agg."userId"
        `);

        // courts.totalRevenue += captured payments on bookings of that court
        await queryRunner.query(`
            UPDATE "courts" c
            SET "totalRevenue" = COALESCE(c."totalRevenue", 0) + agg.total
            FROM (
                SELECT b."courtId" AS "courtId", SUM(p.amount) AS total
                FROM "payments" p
                JOIN "bookings" b ON b.id = p."bookingId"
                WHERE p.status = 'completed' AND p."createdAt" < '${cutoff}'
                GROUP BY b."courtId"
            ) agg
            WHERE c.id = agg."courtId"
        `);

        // branches.totalRevenue += same, resolved via courts
        await queryRunner.query(`
            UPDATE "branches" br
            SET "totalRevenue" = COALESCE(br."totalRevenue", 0) + agg.total
            FROM (
                SELECT c."branchId" AS "branchId", SUM(p.amount) AS total
                FROM "payments" p
                JOIN "bookings" b ON b.id = p."bookingId"
                JOIN "courts" c ON c.id = b."courtId"
                WHERE p.status = 'completed' AND p."createdAt" < '${cutoff}'
                GROUP BY c."branchId"
            ) agg
            WHERE br.id = agg."branchId"
        `);

        // tenants.totalRevenue += same, resolved via branches
        await queryRunner.query(`
            UPDATE "tenants" t
            SET "totalRevenue" = COALESCE(t."totalRevenue", 0) + agg.total
            FROM (
                SELECT br."tenantId" AS "tenantId", SUM(p.amount) AS total
                FROM "payments" p
                JOIN "bookings" b ON b.id = p."bookingId"
                JOIN "courts" c ON c.id = b."courtId"
                JOIN "branches" br ON br.id = c."branchId"
                WHERE p.status = 'completed' AND p."createdAt" < '${cutoff}'
                GROUP BY br."tenantId"
            ) agg
            WHERE t.id = agg."tenantId"
        `);

        // users.bookingsCount = live count of non-cancelled created bookings
        // (idempotent; matches the creator-only CREATED listener semantics)
        await queryRunner.query(`
            UPDATE "users" u
            SET "bookingsCount" = agg.cnt
            FROM (
                SELECT b."userId" AS "userId", COUNT(*)::int AS cnt
                FROM "bookings" b
                WHERE b."userId" IS NOT NULL AND b.status != 'cancelled'
                GROUP BY b."userId"
            ) agg
            WHERE u.id = agg."userId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Data backfill: exact reversal is not possible (bookingsCount was
        // overwritten, and counters may have moved since), so down is a no-op.
    }

}
