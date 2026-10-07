import { CommonModule } from './common/common.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { SharedModule } from './modules/shared/shared.module';
import { StaffModule } from './modules/staff/staff.module';
import { AssetsModule } from './modules/assets/assets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FriendshipsModule } from './modules/friendships/friendships.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CourtsModule } from './modules/courts/courts.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PostsModule } from './modules/posts/posts.module';
import { LogsModule } from './modules/logging/logging.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { StatsModule } from './modules/stats/stats.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { ContactModule } from './modules/contact/contact.module';
import { OpsModule } from './modules/ops/ops.module';
import { HealthModule } from './modules/health/health.module';
import { VendorsModule } from './modules/vendors/vendors.module';
export const APP_MODULES = [
  CommonModule,
  AdminModule,
  SharedModule,
  AuthModule,
  TenantsModule,
  UsersModule,
  StaffModule,
  AssetsModule,
  BranchesModule,
  CourtsModule,
  SchedulesModule,
  BookmarksModule,
  FriendshipsModule,
  BlocksModule,
  NotificationsModule,
  ReviewsModule,
  BookingsModule,
  PaymentsModule,
  PayoutsModule,
  PostsModule,
  LogsModule,
  ReportingModule,
  StatsModule,
  SubscriptionsModule,
  ContactModule,
  OpsModule,
  HealthModule,
  VendorsModule,
];
