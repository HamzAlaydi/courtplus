import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AssetsModule } from '../assets/assets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { BranchesModule } from '../branches/branches.module';
import { CourtsModule } from '../courts/courts.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostLike]),
    AssetsModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => BookingsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BranchesModule),
    forwardRef(() => CourtsModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule { }
