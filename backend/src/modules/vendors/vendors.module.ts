import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
import { VendorRegistration } from './entities/vendor-registration.entity';
import { StaffInvitation } from '../staff/entities/staff-invitation.entity';
import { Staffer } from '../staff/entities/staff.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VendorRegistration, StaffInvitation, Staffer]),
    SharedModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService],
})
export class VendorsModule {}
