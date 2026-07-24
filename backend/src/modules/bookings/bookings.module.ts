import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { SlotReservation } from './entities/slot-reservation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { SchedulesModule } from 'src/modules/schedules/schedules.module';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { Participant } from './entities/participant.entity';
import { CourtsModule } from 'src/modules/courts/courts.module';
import { BullModule } from '@nestjs/bullmq';
import { BookingsProcessor } from './bookings.processor';
import { BookingEvent } from './entities/event.entity';
import { BookingEventsService } from './events.service';
import { SlotsService } from './slots.service';
import { RemindersService } from './reminders.service';
import { ParticipantsService } from './participants.service';
import { StaffModule } from '../staff/staff.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bookings',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    }),

    TypeOrmModule.forFeature([Booking, Participant, BookingEvent, SlotReservation]),
    SchedulesModule,
    forwardRef(() => NotificationsModule),
    forwardRef(() => PaymentsModule),
    forwardRef(() => CourtsModule),
    forwardRef(() => StaffModule),
    forwardRef(() => TenantsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BranchesModule),
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingEventsService,
    BookingsProcessor,
    SlotsService,
    RemindersService,
    ParticipantsService,
  ],
  exports: [
    BookingsService,
    BookingEventsService,
    BookingsProcessor,
    SlotsService,
    RemindersService,
    ParticipantsService,
  ],
})
export class BookingsModule { }
