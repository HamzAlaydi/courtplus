import { Module, forwardRef } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../reviews/entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Staffer } from '../staff/entities/staff.entity';
import { Court } from '../courts/entities/court.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { BranchesModule } from '../branches/branches.module';
import { CourtsModule } from '../courts/courts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      Booking,
      User,
      Staffer,
      Court,
      Branch,
      Tenant,
    ]),
    forwardRef(() => BranchesModule),
    forwardRef(() => CourtsModule),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule { }
