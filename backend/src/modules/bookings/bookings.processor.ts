import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationType } from '../notifications/entities/notification.entity';
import { BookingsService } from './bookings.service';
import { BookingEventsService } from './events.service';
import { RemindersService } from './reminders.service';
import { PaymentType } from '../payments/entities/payment.entity';
import { BookingStatus, Booking } from './entities/booking.entity';
import { BookingEventType } from './entities/event.entity';
import { REMINDER_INTERVALS } from './booking.constants';
import { dayjs } from '../shared/dayjs';
import { JobType, BookingReminderType, BookingJobData } from './booking-jobs.types';

@Processor('bookings')
@Injectable()
export class BookingsProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingsProcessor.name);

  constructor(
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly eventsService: BookingEventsService,
    private readonly remindersService: RemindersService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<BookingJobData>): Promise<void> {
    const { bookingId, jobType, reminderType, minutesBeforeBooking } = job.data;
    this.logger.log(`Processing job ${job.id} - type: ${jobType}, reminder: ${reminderType}`);

    try {
      // Explicit relations: the default only loads participants, so every
      // reminder fell back to `booking.court?.schedule?.timeZone || 'UTC'`
      // and told customers a time in UTC, with the court and branch names
      // blank in the notification body.
      const booking = await this.bookingsService.findOne(
        { id: bookingId },
        {
          court: { branch: true, schedule: true },
          participants: { payment: true },
        },
      );

      if (!booking) {
        this.logger.warn(`Booking ${bookingId} not found, skipping job`);
        return;
      }

      if (booking.status === BookingStatus.CANCELLED) {
        this.logger.log(`Booking ${bookingId} is cancelled, skipping job`);
        return;
      }

      switch (jobType) {
        case JobType.BOOKING_START:
          await this.processBookingStart(booking);
          break;
        case JobType.BOOKING_END:
          await this.processBookingEnd(booking);
          break;
        case JobType.BOOKING_REMINDER:
          await this.processReminder(booking, reminderType, minutesBeforeBooking);
          break;
        default:
          this.logger.warn(`Unknown job type: ${jobType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job for booking ${bookingId}:`, error);
      throw error;
    }
  }

  private async processReminder(
    booking: Booking,
    reminderType: BookingReminderType,
    minutesBeforeBooking: number,
  ): Promise<void> {
    this.logger.log(`Processing ${minutesBeforeBooking}-minute reminder for booking ${booking.id}`);

    if (reminderType === BookingReminderType.THIRTY_MINUTES && booking.paymentType === PaymentType.SPLIT) {
      await this.bookingsService.processPendingPayments(booking.id);
    }

    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    const reminderTime = minutesBeforeBooking >= 60
      ? `${Math.floor(minutesBeforeBooking / 60)} hour${minutesBeforeBooking >= 120 ? 's' : ''}`
      : `${minutesBeforeBooking} minutes`;

    await this.bookingsService.notifyParticipants(
      booking.id,
      NotificationType.BOOKING_REMINDER,
      {
        bookingId: booking.id,
        minutesBeforeMatch: minutesBeforeBooking,
        time: reminderTime,
      },
      [],
      {
        courtName: booking.court?.name,
        branchName: booking.court?.branch?.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court?.sport,
        bookingId: booking.id,
        reminderTime,
      },
    );

    await this.bookingsService.notifyStaffBookingReminder(booking, reminderTime, {
      bookingId: booking.id,
      courtName: booking.court?.name,
      branchName: booking.court?.branch?.name,
      inTime: reminderTime,
      date: startDateLocal.format('MMM DD, YYYY'),
      startTime: startDateLocal.format('h:mm A'),
      endTime: endDateLocal.format('h:mm A'),
      expectedAttendees: booking.participants?.length?.toString(),
    });

    await this.scheduleNextReminder(booking, minutesBeforeBooking);
  }

  private async scheduleNextReminder(booking: Booking, currentMinutes: number): Promise<void> {
    let nextMinutes: number | null = null;

    if (currentMinutes === REMINDER_INTERVALS.HOUR) {
      nextMinutes = REMINDER_INTERVALS.HALF_HOUR;
    } else if (currentMinutes === REMINDER_INTERVALS.HALF_HOUR) {
      nextMinutes = REMINDER_INTERVALS.QUARTER_HOUR;
    }

    if (nextMinutes !== null) {
      await this.remindersService.scheduleBookingReminder(
        booking.id,
        booking.startDate,
        nextMinutes,
      );
    }

    if (currentMinutes === REMINDER_INTERVALS.HOUR) {
      await this.remindersService.scheduleBookingStatusJobs(
        booking.id,
        booking.startDate,
        booking.endDate,
      );
    }
  }

  private async processBookingStart(booking: Booking): Promise<void> {
    this.logger.log(`Processing booking start for booking ${booking.id}`);

    const updated = await this.bookingsService.changeBookingStatus(
      booking.id,
      BookingStatus.PENDING,
      BookingStatus.IN_PROGRESS,
    );

    if (!updated) {
      this.logger.log(`Booking ${booking.id} is not pending (status: ${booking.status}), skipping start`);
      return;
    }

    await this.eventsService.create({
      bookingId: booking.id,
      event: BookingEventType.STARTED,
    });

    await this.bookingsService.notifyParticipants(
      booking.id,
      NotificationType.BOOKING_STARTED,
      { bookingId: booking.id },
    );
  }

  private async processBookingEnd(booking: Booking): Promise<void> {
    this.logger.log(`Processing booking end for booking ${booking.id}`);

    let updated = await this.bookingsService.changeBookingStatus(
      booking.id,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
    );

    if (!updated) {
      // The booking never transitioned to IN_PROGRESS (e.g. its start job was
      // missed because it was created after startDate), but its time has
      // passed — close it out instead of leaving it pending forever.
      updated = await this.bookingsService.changeBookingStatus(
        booking.id,
        BookingStatus.PENDING,
        BookingStatus.COMPLETED,
      );
    }

    if (!updated) {
      this.logger.log(`Booking ${booking.id} is not pending or in progress (status: ${booking.status}), skipping end`);
      return;
    }

    // Safety net for the organiser's hold. Settlement used to run ONLY from
    // the 30-minute reminder, which is never scheduled for a match created
    // less than 30 minutes before kick-off — the authorisation then simply
    // expired at Stripe and the venue was never paid for the unpaid seats.
    // Runs before ENDED so the revenue is credited, then released.
    if (booking.paymentType === PaymentType.SPLIT) {
      try {
        await this.bookingsService.processPendingPayments(booking.id);
      } catch (error) {
        this.logger.error(
          `Failed to settle pending payments for booking ${booking.id} at end: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    }

    await this.eventsService.create({
      bookingId: booking.id,
      event: BookingEventType.ENDED,
    });

    this.eventEmitter.emit(BookingEventType.ENDED, {
      booking,
    });

    await this.bookingsService.notifyParticipants(
      booking.id,
      NotificationType.BOOKING_ENDED,
      { bookingId: booking.id },
    );

    await this.bookingsService.notifyRateReminder(booking);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BookingJobData>, error: Error) {
    const { bookingId, jobType } = job.data;
    const attemptsMade = job.attemptsMade;
    const maxAttempts = job.opts.attempts || 3;

    if (attemptsMade >= maxAttempts) {
      this.logger.error(
        `Job ${job.id} permanently failed after ${attemptsMade} attempts. ` +
        `Booking: ${bookingId}, Type: ${jobType}, Error: ${error.message}`,
        error.stack,
      );
    } else {
      this.logger.warn(
        `Job ${job.id} failed (attempt ${attemptsMade}/${maxAttempts}). ` +
        `Booking: ${bookingId}, Type: ${jobType}, Error: ${error.message}`,
      );
    }
  }
}
