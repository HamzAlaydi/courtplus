import { Module, forwardRef } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { AssetsModule } from 'src/modules/assets/assets.module';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { CourtsModule } from '../courts/courts.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, Location, Booking]),
    AssetsModule,
    forwardRef(() => CourtsModule),
    forwardRef(() => BookmarksModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => TenantsModule),
    forwardRef(() => SubscriptionsModule),
    SchedulesModule,
  ],
  controllers: [BranchesController],
  providers: [BranchesService, LocationsService],
  exports: [BranchesService, LocationsService],
})
export class BranchesModule {}
