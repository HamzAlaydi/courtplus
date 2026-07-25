import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Court } from '../courts/entities/court.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BillingController } from './billing.controller';
import { PricingService } from './pricing.service';
import { PaymentsModule } from '../payments/payments.module';
import { TenantsModule } from '../tenants/tenants.module';
import { BranchesModule } from '../branches/branches.module';
import { CourtsModule } from '../courts/courts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Branch, Court]),
    forwardRef(() => PaymentsModule),
    forwardRef(() => TenantsModule),
    forwardRef(() => BranchesModule),
    forwardRef(() => CourtsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => StaffModule),
  ],
  controllers: [SubscriptionsController, BillingController],
  providers: [SubscriptionsService, PricingService],
  exports: [SubscriptionsService, PricingService],
})
export class SubscriptionsModule {}
