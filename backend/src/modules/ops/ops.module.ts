import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { Court } from '../courts/entities/court.entity';
import { UnsuspendRequest } from '../tenants/entities/unsuspend-request.entity';
import { CourtsModule } from '../courts/courts.module';
import { BranchesModule } from '../branches/branches.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StaffModule } from '../staff/staff.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Court, UnsuspendRequest]),
    CourtsModule,
    BranchesModule,
    TenantsModule,
    StaffModule,
    NotificationsModule,
    AssetsModule,
  ],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
