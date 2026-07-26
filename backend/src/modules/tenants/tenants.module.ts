import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { TenantPreferences } from './entities/tenant-preferences.entity';
import { UnsuspendRequest } from './entities/unsuspend-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from 'src/modules/assets/assets.module';
import { TenantsController } from './tenants.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BranchesModule } from '../branches/branches.module';
import { Booking } from '../bookings/entities/booking.entity';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantPreferences, UnsuspendRequest, Booking]), AssetsModule, forwardRef(() => SubscriptionsModule), forwardRef(() => NotificationsModule), forwardRef(() => BranchesModule)],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule { }
