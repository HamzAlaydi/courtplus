import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { Report } from './entities/report.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CourtsModule } from '../courts/courts.module';
import { UsersModule } from '../users/users.module';
import { BranchesModule } from '../branches/branches.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    NotificationsModule,
    UsersModule,
    BranchesModule,
    CourtsModule,
    StaffModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}
