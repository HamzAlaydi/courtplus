import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Recomputes every denormalized booking/revenue counter from the rows that
 * actually own the truth (bookings + payments).
 *
 * Why this exists: those counters are maintained by event listeners, so any
 * booking created while a listener was missing, failing, or not yet deployed
 * left the counter permanently wrong with no path back. In practice a venue
 * with a season of completed bookings showed "Total Income 0 / Minutes Booked
 * 0 / Upcoming matches 0", and a branch that had refunds counted but never
 * captures showed NEGATIVE revenue.
 *
 * Unlike BackfillPaymentCounters1785052800000 (which ADDS to the existing
 * value and therefore must never run twice), every statement here is a SET
 * from source data, so this migration is idempotent and can be re-run.
 *
 * Definitions mirror the listeners in StatsService exactly:
 *  - totalBookings      : bookings not cancelled
 *  - minutesBooked      : SUM(duration) over the same set
 *  - upcomingBookings   : the same set with startDate still in the future
 *  - totalOpenBookings  : open matches, not cancelled, not yet ended
 *  - totalRevenue       : SUM(amount) of payments in status 'completed'
 *                         (refund() flips the row to 'refunded', so a fully
 *                         refunded payment contributes 0 by construction)
 */
export class ReconcileDenormalizedCounters1794000012000
  implements MigrationInterface
{
  name = 'ReconcileDenormalizedCounters1794000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---- courts -----------------------------------------------------------
    await queryRunner.query(`
      UPDATE "courts" c
      SET "totalBookings"     = COALESCE(agg.total, 0),
          "minutesBooked"     = COALESCE(agg.minutes, 0),
          "upcomingBookings"  = COALESCE(agg.upcoming, 0),
          "totalOpenBookings" = COALESCE(agg.open_now, 0)
      FROM (
        SELECT x.id,
               COUNT(b.id)                                              AS total,
               COALESCE(SUM(b.duration), 0)                             AS minutes,
               COUNT(b.id) FILTER (WHERE b."startDate" > now())         AS upcoming,
               COUNT(b.id) FILTER (WHERE b.open AND b."endDate" > now()) AS open_now
        FROM "courts" x
        LEFT JOIN "bookings" b
          ON b."courtId" = x.id AND b.status <> 'cancelled'
        GROUP BY x.id
      ) agg
      WHERE c.id = agg.id
    `);

    await queryRunner.query(`
      UPDATE "courts" c
      SET "totalRevenue" = COALESCE(agg.total, 0)
      FROM (
        SELECT x.id, COALESCE(SUM(p.amount), 0) AS total
        FROM "courts" x
        LEFT JOIN "bookings" b ON b."courtId" = x.id
        LEFT JOIN "payments" p ON p."bookingId" = b.id AND p.status = 'completed'
        GROUP BY x.id
      ) agg
      WHERE c.id = agg.id
    `);

    // ---- branches ---------------------------------------------------------
    await queryRunner.query(`
      UPDATE "branches" br
      SET "totalBookings"     = COALESCE(agg.total, 0),
          "minutesBooked"     = COALESCE(agg.minutes, 0),
          "upcomingBookings"  = COALESCE(agg.upcoming, 0),
          "totalOpenBookings" = COALESCE(agg.open_now, 0)
      FROM (
        SELECT x.id,
               COUNT(b.id)                                              AS total,
               COALESCE(SUM(b.duration), 0)                             AS minutes,
               COUNT(b.id) FILTER (WHERE b."startDate" > now())         AS upcoming,
               COUNT(b.id) FILTER (WHERE b.open AND b."endDate" > now()) AS open_now
        FROM "branches" x
        LEFT JOIN "courts" c  ON c."branchId" = x.id
        LEFT JOIN "bookings" b
          ON b."courtId" = c.id AND b.status <> 'cancelled'
        GROUP BY x.id
      ) agg
      WHERE br.id = agg.id
    `);

    await queryRunner.query(`
      UPDATE "branches" br
      SET "totalRevenue" = COALESCE(agg.total, 0)
      FROM (
        SELECT x.id, COALESCE(SUM(p.amount), 0) AS total
        FROM "branches" x
        LEFT JOIN "courts" c    ON c."branchId" = x.id
        LEFT JOIN "bookings" b  ON b."courtId" = c.id
        LEFT JOIN "payments" p  ON p."bookingId" = b.id AND p.status = 'completed'
        GROUP BY x.id
      ) agg
      WHERE br.id = agg.id
    `);

    // ---- tenants ----------------------------------------------------------
    await queryRunner.query(`
      UPDATE "tenants" t
      SET "totalBookings" = COALESCE(agg.total, 0),
          "totalRevenue"  = COALESCE(agg.revenue, 0)
      FROM (
        SELECT x.id,
               COUNT(b.id) FILTER (WHERE b.status <> 'cancelled')        AS total,
               COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) AS revenue
        FROM "tenants" x
        LEFT JOIN "branches" br ON br."tenantId" = x.id
        LEFT JOIN "courts" c    ON c."branchId" = br.id
        LEFT JOIN "bookings" b  ON b."courtId" = c.id
        LEFT JOIN "payments" p  ON p."bookingId" = b.id
        GROUP BY x.id
      ) agg
      WHERE t.id = agg.id
    `);

    // ---- users ------------------------------------------------------------
    // Creator-only, matching UsersService.handleBookingCreated.
    await queryRunner.query(`
      UPDATE "users" u
      SET "bookingsCount"      = COALESCE(agg.total, 0),
          "minutesBookedCount" = COALESCE(agg.minutes, 0)
      FROM (
        SELECT x.id,
               COUNT(b.id)                  AS total,
               COALESCE(SUM(b.duration), 0) AS minutes
        FROM "users" x
        LEFT JOIN "bookings" b
          ON b."userId" = x.id AND b.status <> 'cancelled'
        GROUP BY x.id
      ) agg
      WHERE u.id = agg.id
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "totalSpent" = COALESCE(agg.total, 0)
      FROM (
        SELECT x.id, COALESCE(SUM(p.amount), 0) AS total
        FROM "users" x
        LEFT JOIN "payments" p ON p."userId" = x.id AND p.status = 'completed'
        GROUP BY x.id
      ) agg
      WHERE u.id = agg.id
    `);
  }

  public async down(): Promise<void> {
    // Nothing to undo: this only restores counters to the value implied by
    // the source rows. Reverting would mean re-introducing known-wrong data.
  }
}
