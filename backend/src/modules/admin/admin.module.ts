import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { BookingsModule } from '../bookings/bookings.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [UsersModule, TenantsModule, BookingsModule, StaffModule],
  controllers: [AdminController],
})
export class AdminModule { }
