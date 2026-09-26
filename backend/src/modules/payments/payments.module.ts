import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { BullModule } from '@nestjs/bullmq';
import { PaymentsProcessor } from './payments.processor';
import { ProcessedWebhookEvent } from './entities/processed-webhook-event.entity';
import { WebhookIdempotencyService } from './webhook-idempotency.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payments',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    }),
    TypeOrmModule.forFeature([Payment, ProcessedWebhookEvent]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeService,
    PaymentsProcessor,
    WebhookIdempotencyService,
  ],
  exports: [PaymentsService, WebhookIdempotencyService],
})
export class PaymentsModule { }
