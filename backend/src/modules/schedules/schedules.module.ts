import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { Availability } from './entities/availability.entity';
import { SchedulesEvents } from './schedules.events';
@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Availability])],
  providers: [SchedulesService, SchedulesEvents],
  exports: [SchedulesService],
})
export class SchedulesModule {}
