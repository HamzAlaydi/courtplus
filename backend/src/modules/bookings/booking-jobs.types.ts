export enum JobType {
  BOOKING_START = 'booking_start',
  BOOKING_END = 'booking_end',
  BOOKING_REMINDER = 'booking_reminder',
  PAYMENT_REMINDER = 'payment_reminder',
}

export enum BookingReminderType {
  ONE_HOUR = 'one_hour',
  THIRTY_MINUTES = 'thirty_minutes',
  FIFTEEN_MINUTES = 'fifteen_minutes',
}

export interface BookingJobData {
  bookingId: string;
  startDate?: Date;
  reminderType?: BookingReminderType;
  minutesBeforeBooking?: number;
  jobType: JobType;
}
