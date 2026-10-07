import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1. Webhook idempotency ledger.
 *    Stripe delivers at-least-once, retries for ~3 days on any non-2xx, and
 *    does not guarantee ordering. There was no deduplication anywhere, so a
 *    retried invoice.paid could re-activate a cancelled subscription and a
 *    retried transfer event could credit a tenant twice. The Stripe event id
 *    is the primary key, so the INSERT itself is the mutual exclusion.
 *
 * 2. Missing indexes on hot paths.
 *    Postgres does not index foreign keys automatically. `payments` had NO
 *    indexes at all while the Stripe webhook looks a row up by
 *    providerPaymentId on every single event — a sequential scan over the
 *    whole payments table per webhook. `logs` had none while the ops audit
 *    screen sorts and counts the entire table.
 *
 * All indexes are created CONCURRENTLY so they do not take an ACCESS EXCLUSIVE
 * lock on a live table. That requires running outside a transaction — see
 * transaction = false below.
 */
export class WebhookIdempotencyAndIndexes1790000001000
  implements MigrationInterface
{
  name = 'WebhookIdempotencyAndIndexes1790000001000';

  // CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
  transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
        "id"          character varying(255) NOT NULL,
        "type"        character varying(255) NOT NULL,
        "source"      character varying(64)  NOT NULL,
        "processedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_processed_webhook_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_processed_webhook_type"
        ON "processed_webhook_events" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_processed_webhook_createdAt"
        ON "processed_webhook_events" ("processedAt")
    `);

    // --- payments: looked up by Stripe id on every webhook ------------------
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_providerPaymentId"
        ON "payments" ("providerPaymentId")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_bookingId"
        ON "payments" ("bookingId")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_userId"
        ON "payments" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payment_status"
        ON "payments" ("status")
    `);

    // --- balance ledger: reconciliation and the refund-idempotency lookup ---
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_balance_tx_tenant_booking_type"
        ON "balance_transactions" ("tenantId", "bookingId", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_balance_tx_tenant_createdAt"
        ON "balance_transactions" ("tenantId", "createdAt")
    `);

    // --- bookings: the completion cron sweep -------------------------------
    // Only this one is added. bookings already has idx_booking_court_dates
    // (courtId, startDate) and idx_booking_userId, and idx_booking_status_dates
    // is (status, startDate, endDate) whose leading column cannot serve an
    // endDate range scan — which is exactly what the sweep does.
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_booking_status_end"
        ON "bookings" ("status", "endDate")
    `);

    // --- logs: the ops audit screen sorts and counts the whole table -------
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_logs_createdAt"
        ON "logs" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const idx of [
      'idx_logs_createdAt',
      'idx_booking_status_end',
      'idx_balance_tx_tenant_createdAt',
      'idx_balance_tx_tenant_booking_type',
      'idx_payment_status',
      'idx_payment_userId',
      'idx_payment_bookingId',
      'idx_payment_providerPaymentId',
    ]) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${idx}"`);
    }
    await queryRunner.query(`DROP TABLE IF EXISTS "processed_webhook_events"`);
  }
}
