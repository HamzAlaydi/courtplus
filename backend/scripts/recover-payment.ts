/**
 * One-off ops script: re-run the payment success path for a payment whose
 * charge.succeeded webhook was skipped after an earlier charge.failed
 * (e.g. payment 9449ae7c-a772-4eb4-b1e0-caa9acd7dbc9 / pi_3TwsurAE6urIzXY01ZT4Zf2P).
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/recover-payment.ts <stripePaymentIntentId>
 *
 * Safety:
 *  - Refuses to touch a payment that already has a bookingId, or that is in a
 *    processed/terminal state (only `failed` and `pending` are recoverable).
 *  - The success path itself only creates a booking when payment.bookingId is
 *    null, and booking creation is further guarded by slot-availability, so
 *    it cannot double-create a booking or double-charge (no new charge is
 *    created — the existing succeeded PaymentIntent is only reconciled).
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from '../src/app.module';
import {
  Payment,
  PaymentStatus,
} from '../src/modules/payments/entities/payment.entity';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { NotificationType } from '../src/modules/notifications/entities/notification.entity';

async function main() {
  const paymentIntentId = process.argv[2];
  if (!paymentIntentId) {
    console.error(
      'Usage: recover-payment.ts <stripePaymentIntentId> (e.g. pi_3TwsurAE6urIzXY01ZT4Zf2P)',
    );
    process.exit(1);
  }

  initializeTransactionalContext();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const dataSource = app.get(DataSource);
    const bookingsService = app.get(BookingsService);
    const notificationsService = app.get(NotificationsService);

    const payment = await dataSource.getRepository(Payment).findOne({
      where: { providerPaymentId: paymentIntentId },
    });

    if (!payment) {
      console.error(
        `Payment not found for providerPaymentId: ${paymentIntentId}`,
      );
      process.exit(1);
    }

    console.log(
      `Found payment ${payment.id} - status: ${payment.status}, bookingId: ${payment.bookingId ?? 'none'}`,
    );

    if (payment.bookingId) {
      console.log(
        `Payment is already linked to booking ${payment.bookingId} - nothing to do.`,
      );
      return;
    }

    const RECOVERABLE_STATUSES: PaymentStatus[] = [
      PaymentStatus.FAILED,
      PaymentStatus.PENDING,
    ];
    if (!RECOVERABLE_STATUSES.includes(payment.status)) {
      console.error(
        `Refusing to recover payment in status '${payment.status}' (expected 'failed' or 'pending').`,
      );
      process.exit(1);
    }

    await bookingsService.processParticipantPayment(payment);

    // Mirror the webhook success path (processPayment): notify the payer.
    await notificationsService.sendNotification(payment.userId, {
      type: NotificationType.PAYMENT_SUCCEEDED,
      data: {
        bookingId: payment.bookingId,
      },
    });

    console.log(
      `Recovery complete - paymentId: ${payment.id}, bookingId: ${payment.bookingId}, status: ${payment.status}`,
    );
  } finally {
    // Force-exit: queue/redis connections from the app context can otherwise
    // keep the process alive after the work is done.
    await app.close().catch(() => undefined);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
