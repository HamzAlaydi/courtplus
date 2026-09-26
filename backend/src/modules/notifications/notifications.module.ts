import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRealtimeService } from './notifications-realtime.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/users/users.module';
import { StaffModule } from 'src/modules/staff/staff.module';
import { Notification } from './entities/notification.entity';
import { Session } from 'src/modules/auth/entities/session.entity';
import { BranchesModule } from '../branches/branches.module';
import { CourtsModule } from '../courts/courts.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PostsModule } from '../posts/posts.module';
import { ReviewsModule } from '../reviews/reviews.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Session]),
    forwardRef(() => BranchesModule),
    forwardRef(() => CourtsModule),
    forwardRef(() => StaffModule),
    forwardRef(() => PostsModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BookingsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRealtimeService],
  exports: [NotificationsService, NotificationsRealtimeService],
})
export class NotificationsModule { }
