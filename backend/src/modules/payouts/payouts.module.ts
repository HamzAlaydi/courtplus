import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantBalance } from './entities/tenant-balance.entity';
import { BalanceTransaction } from './entities/balance-transaction.entity';
import { Payout } from './entities/payout.entity';
import { TenantPayoutSettings } from './entities/tenant-payout-settings.entity';
import { PayoutsController } from './controllers/payouts.controller';
import { PayoutsWebhookController } from './controllers/payouts-webhook.controller';
import { PayoutsService } from './services/payouts.service';
import { BalanceService } from './services/balance.service';
import { PayoutProviderFactory } from './providers/payout-provider.factory';
import { StripePayoutProvider } from './providers/stripe-payout.provider';
import { ManualPayoutProvider } from './providers/manual-payout.provider';
import { BranchesModule } from '../branches/branches.module';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { PaymentsModule } from 'src/modules/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantBalance,
      BalanceTransaction,
      Payout,
      TenantPayoutSettings,
      // Read-only: needed to resolve courtId -> tenantId when reversing a
      // tenant's revenue on refund.
      Booking,
    ]),
    forwardRef(() => BranchesModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [PayoutsController, PayoutsWebhookController],
  providers: [
    PayoutsService,
    BalanceService,
    PayoutProviderFactory,
    ManualPayoutProvider,
    StripePayoutProvider,
  ],
  exports: [PayoutsService, BalanceService],
})
export class PayoutsModule {}
