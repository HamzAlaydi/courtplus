import { forwardRef, Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staffer } from './entities/staff.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
import { SharedModule } from '../shared/shared.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { BranchStaffer } from './entities/branch-staffer.entity';
import { BranchesModule } from '../branches/branches.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Staffer, StaffInvitation, BranchStaffer]),
    SharedModule,
    TenantsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => BranchesModule),
  ],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule { }
