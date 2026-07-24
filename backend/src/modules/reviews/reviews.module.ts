import { Module, forwardRef } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CourtsModule } from '../courts/courts.module';
import { StaffModule } from '../staff/staff.module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => BookingsModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => CourtsModule),
    forwardRef(() => StaffModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BranchesModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule { }
