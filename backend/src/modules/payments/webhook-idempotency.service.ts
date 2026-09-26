import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { DistributedLockService } from 'src/common/distributed-lock.service';

/**
 * Exactly-once processing for Stripe webhooks.
 *
 * Usage in a webhook controller:
 *
 *   if (await this.idempotency.alreadyProcessed(event, 'payments')) return { received: true };
 *   ...handle...
 *
 * `alreadyProcessed` claims the event by INSERTing its id. The primary-key
 * constraint does the mutual exclusion, so two concurrent deliveries of the
 * same event cannot both proceed — no SELECT-then-INSERT race.
 */
@Injectable()
export class WebhookIdempotencyService {
  private readonly logger = new Logger(WebhookIdempotencyService.name);

  constructor(
    @InjectRepository(ProcessedWebhookEvent)
    private readonly repo: Repository<ProcessedWebhookEvent>,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Returns true if this event has already been handled (caller should ack and
   * do nothing). Returns false after successfully claiming it.
   */
  async alreadyProcessed(
    event: { id?: string; type?: string },
    source: string,
  ): Promise<boolean> {
    if (!event?.id) {
      // No id means we cannot dedupe; process it rather than silently dropping.
      this.logger.warn(`Webhook from ${source} has no event id — cannot dedupe.`);
      return false;
    }

    try {
      const result = await this.repo
        .createQueryBuilder()
        .insert()
        .into(ProcessedWebhookEvent)
        .values({ id: event.id, type: event.type ?? 'unknown', source })
        .orIgnore()
        .returning('id')
        .execute();

      // ON CONFLICT DO NOTHING ... RETURNING id yields a row only when the
      // insert actually happened. Do NOT consult `result.identifiers`: TypeORM
      // fills it from the values we supplied (the PK is ours, not generated),
      // so it is length 1 even for a duplicate — which is exactly how every
      // redelivered Stripe event used to be processed twice.
      const claimed = (result.raw?.length ?? 0) > 0;

      if (!claimed) {
        this.logger.log(
          `Duplicate Stripe event ${event.id} (${event.type}) from ${source} — skipping.`,
        );
        return true;
      }

      return false;
    } catch (error) {
      // Never let the dedupe layer break webhook handling: failing open here
      // re-processes an event at worst, whereas failing closed would drop it.
      this.logger.error(
        `Idempotency check failed for ${event.id}; processing anyway.`,
        error as Error,
      );
      return false;
    }
  }

  /**
   * Release an event id so a failed handler can be retried by Stripe.
   * Call this when handling throws, otherwise the retry would be deduped away.
   */
  async release(eventId?: string): Promise<void> {
    if (!eventId) return;
    try {
      await this.repo.delete({ id: eventId });
    } catch (error) {
      this.logger.error(`Could not release event ${eventId}`, error as Error);
    }
  }

  /**
   * Stripe only retries for ~3 days, so rows older than 30 days can never
   * dedupe anything again. Without this the table grows forever.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async pruneOldEvents(): Promise<void> {
    await this.lockService.runExclusively(
      'webhooks:prune-processed-events',
      10 * 60 * 1000,
      () => this.prune(),
    );
  }

  private async prune(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('"processedAt" < :cutoff', { cutoff })
      .execute();
    if (result.affected) {
      this.logger.log(`Pruned ${result.affected} processed webhook events.`);
    }
  }
}
