import { Module, forwardRef } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { Court } from './entities/court.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { AssetsModule } from '../assets/assets.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { BookingsModule } from '../bookings/bookings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court]),
    forwardRef(() => BranchesModule),
    AssetsModule,
    SchedulesModule,
    forwardRef(() => BookmarksModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
