import { Column, Entity, Index, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Ledger of Stripe events this service has already handled.
 *
 * Stripe guarantees at-least-once delivery, retries for up to three days on any
 * non-2xx, and does NOT guarantee ordering. Before this table existed there was
 * no deduplication anywhere: each handler relied on ad-hoc state checks, so a
 * retried `invoice.paid` could re-activate a cancelled subscription and a
 * retried transfer event could credit a tenant's balance twice.
 *
 * The Stripe event id is the primary key, so the insert itself is the lock —
 * a duplicate raises a unique violation rather than racing a SELECT.
 */
@Entity('processed_webhook_events')
export class ProcessedWebhookEvent {
  /** Stripe event id, e.g. evt_1P... */
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index('idx_processed_webhook_type')
  type: string;

  /** Which endpoint consumed it (payments / subscriptions / payouts). */
  @Column({ type: 'varchar', length: 64 })
  source: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @Index('idx_processed_webhook_createdAt')
  processedAt: Date;
}
