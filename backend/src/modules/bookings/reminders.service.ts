import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { dayjs } from '../shared/dayjs';
import { REMINDER_INTERVALS } from './booking.constants';
import { BookingReminderType, JobType } from './booking-jobs.types';
import { Booking } from './entities/booking.entity';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectQueue('bookings')
    private readonly queue: Queue,
  ) { }

  async schedulePaymentReminders(
    bookingId: string,
    userId: string,
    startDate: Date,
    minutesBeforeBooking: number,
  ): Promise<void> {
    const delay = dayjs(startDate)
      .subtract(minutesBeforeBooking, 'minutes')
      .diff(dayjs(), 'milliseconds');

    if (delay <= 0) {
      this.logger.warn(
        `Skipping payment reminder for booking ${bookingId} - delay is negative: ${delay}ms`,
      );
      return;
    }

    await this.queue.add(
      `payment_reminder_${bookingId}`,
      {
        bookingId,
        userId,
      },
      {
        jobId: `payment_reminder_${bookingId}_${minutesBeforeBooking}`,
        delay,
      },
    );
  }

  async scheduleBookingReminders(booking: Booking): Promise<void> {
    const timeUntilBooking = dayjs(booking.startDate).diff(dayjs(), 'minutes');

    if (timeUntilBooking > REMINDER_INTERVALS.HOUR) {
      await this.scheduleBookingReminder(
        booking.id,
        booking.startDate,
        REMINDER_INTERVALS.HOUR,
      );
    } else if (timeUntilBooking > REMINDER_INTERVALS.HALF_HOUR) {
      await this.scheduleBookingReminder(
        booking.id,
        booking.startDate,
        REMINDER_INTERVALS.HALF_HOUR,
      );
    } else if (timeUntilBooking > REMINDER_INTERVALS.QUARTER_HOUR) {
      await this.scheduleBookingReminder(
        booking.id,
        booking.startDate,
        REMINDER_INTERVALS.QUARTER_HOUR,
      );
    } else if (timeUntilBooking > 0) {
      await this.scheduleBookingStatusJobs(
        booking.id,
        booking.startDate,
        booking.endDate,
      );
    }
  }

  async scheduleBookingReminder(
    bookingId: string,
    startDate: Date,
    minutesBeforeBooking: number,
  ): Promise<void> {
    const reminderType = this.getReminderType(minutesBeforeBooking);
    const delay = dayjs(startDate)
      .subtract(minutesBeforeBooking, 'minutes')
      .diff(dayjs(), 'milliseconds');

    if (delay <= 0) {
      this.logger.warn(
        `Skipping reminder for booking ${bookingId} - delay is negative: ${delay}ms`,
      );
      return;
    }

    await this.queue.add(
      'booking-reminder',
      {
        reminderType,
        bookingId,
        startDate,
        minutesBeforeBooking,
        jobType: JobType.BOOKING_REMINDER,
      },
      {
        jobId: `reminder_${bookingId}_${minutesBeforeBooking}`,
        delay,
      },
    );
  }

  private getReminderType(minutesBeforeBooking: number): BookingReminderType {
    switch (minutesBeforeBooking) {
      case REMINDER_INTERVALS.HOUR:
        return BookingReminderType.ONE_HOUR;
      case REMINDER_INTERVALS.HALF_HOUR:
        return BookingReminderType.THIRTY_MINUTES;
      case REMINDER_INTERVALS.QUARTER_HOUR:
        return BookingReminderType.FIFTEEN_MINUTES;
      default:
        return BookingReminderType.ONE_HOUR;
    }
  }

  async scheduleBookingStatusJobs(
    bookingId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const startDelay = dayjs(startDate).diff(dayjs(), 'milliseconds');
    const endDelay = dayjs(endDate).diff(dayjs(), 'milliseconds');

    if (startDelay > 0) {
      await this.queue.add(
        'booking-status',
        {
          bookingId,
          jobType: JobType.BOOKING_START,
        },
        {
          jobId: `start_${bookingId}`,
          delay: startDelay,
        },
      );
    }

    if (endDelay > 0) {
      await this.queue.add(
        'booking-status',
        {
          bookingId,
          jobType: JobType.BOOKING_END,
        },
        {
          jobId: `end_${bookingId}`,
          delay: endDelay,
        },
      );
    }
  }

  async removeReminders(bookingId: string): Promise<void> {
    await Promise.allSettled([
      this.queue.remove(`reminder_${bookingId}_${REMINDER_INTERVALS.HOUR}`),
      this.queue.remove(`reminder_${bookingId}_${REMINDER_INTERVALS.HALF_HOUR}`),
      this.queue.remove(
        `reminder_${bookingId}_${REMINDER_INTERVALS.QUARTER_HOUR}`,
      ),
      this.queue.remove(
        `payment_reminder_${bookingId}_${REMINDER_INTERVALS.HOUR}`,
      ),
      this.queue.remove(
        `payment_reminder_${bookingId}_${REMINDER_INTERVALS.HALF_HOUR}`,
      ),
      this.queue.remove(
        `payment_reminder_${bookingId}_${REMINDER_INTERVALS.QUARTER_HOUR}`,
      ),
      this.queue.remove(`start_${bookingId}`),
      this.queue.remove(`end_${bookingId}`),
    ]);
  }
}
