import { BaseEntity } from 'src/common/base-entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Availability } from './availability.entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
import { dayjs } from 'src/modules/shared/dayjs';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Slot } from 'src/modules/courts/dto/slots-response.dto';
import { SlotReservation } from 'src/modules/bookings/entities/slot-reservation.entity';
@Entity('schedules')
@Index('schedule_branch_idx', ['branchId'])
@Index('schedule_court_idx', ['courtId'])
export class Schedule extends BaseEntity {
  @Column('uuid', { nullable: true })
  branchId?: string;

  @Column('uuid', { nullable: true })
  courtId?: string;

  @Column()
  timeZone: string = 'UTC';

  @OneToMany(() => Availability, (availability) => availability.schedule, {
    onDelete: 'CASCADE',
  })
  availabilities: Availability[];

  @OneToOne(() => Branch, (branch) => branch.schedule)
  @JoinColumn({ name: 'branchId' })
  branch?: Branch;

  @OneToOne(() => Court, (court) => court.schedule)
  @JoinColumn({ name: 'courtId' })
  court?: Court;



  private checkSlotOverlapWithBooking(
    slotStart: dayjs.Dayjs,
    slotEnd: dayjs.Dayjs,
    bookings: Booking[],
  ): Booking | null {
    return bookings.find((booking) => {
      const bookingStart = dayjs.tz(booking.startDate, this.timeZone);
      const bookingEnd = dayjs.tz(booking.endDate, this.timeZone);

      return (
        (slotStart.isSameOrAfter(bookingStart) &&
          slotStart.isBefore(bookingEnd)) ||
        (slotEnd.isAfter(bookingStart) && slotEnd.isSameOrBefore(bookingEnd)) ||
        (slotStart.isSameOrBefore(bookingStart) &&
          slotEnd.isSameOrAfter(bookingEnd))
      );
    }) || null;
  }

  private checkSlotOverlapWithReservedSlots(
    slotStart: dayjs.Dayjs,
    slotEnd: dayjs.Dayjs,
    reservedSlots: SlotReservation[],
  ): boolean {
    return reservedSlots.some((reservation) => {
      const reservationStart = dayjs.tz(reservation.startDate, this.timeZone);
      const reservationEnd = dayjs.tz(reservation.endDate, this.timeZone);

      return (
        (slotStart.isSameOrAfter(reservationStart) &&
          slotStart.isBefore(reservationEnd)) ||
        (slotEnd.isAfter(reservationStart) &&
          slotEnd.isSameOrBefore(reservationEnd)) ||
        (slotStart.isSameOrBefore(reservationStart) &&
          slotEnd.isSameOrAfter(reservationEnd))
      );
    });
  }


  checkSlotAvailability(
    slotStart: dayjs.Dayjs,
    slotEnd: dayjs.Dayjs,
    bookings: Booking[],
    reservedSlots: SlotReservation[] = [],
  ): {
    available: boolean;
    reason?: 'SLOT_IN_PAST' | 'SLOT_OVERLAPS_WITH_BOOKING' | 'SLOT_OUTSIDE_SCHEDULE_HOURS' | 'SLOT_RESERVED';
    details?: any;
  } {
    const now = dayjs().tz(this.timeZone);

    if (slotStart.isBefore(now)) {
      return {
        available: false,
        reason: 'SLOT_IN_PAST',
        details: {
          slotStart: slotStart.format(),
          currentTime: now.format(),
          timezone: this.timeZone,
        },
      };
    }

    const overlappingBooking = this.checkSlotOverlapWithBooking(slotStart, slotEnd, bookings);

    if (overlappingBooking) {
      return {
        available: false,
        reason: 'SLOT_OVERLAPS_WITH_BOOKING',
        details: {
          overlappingBookingId: overlappingBooking.id,
          overlappingBookingStart: dayjs.tz(overlappingBooking.startDate, this.timeZone).format(),
          overlappingBookingEnd: dayjs.tz(overlappingBooking.endDate, this.timeZone).format(),
        },
      };
    }

    if (this.checkSlotOverlapWithReservedSlots(slotStart, slotEnd, reservedSlots)) {
      return {
        available: false,
        reason: 'SLOT_RESERVED',
        details: {
          message: 'This slot is temporarily reserved by another user',
        },
      };
    }

    if (!this.isTimeInScheduleAvailabilities(slotStart, slotEnd)) {
      const dayOfWeek = slotStart.day();
      const availabilitiesForDay = this.availabilities?.filter((avail) =>
        avail.days.includes(dayOfWeek),
      );

      return {
        available: false,
        reason: 'SLOT_OUTSIDE_SCHEDULE_HOURS',
        details: {
          requestedDay: slotStart.format('dddd'),
          requestedDayOfWeek: dayOfWeek,
          requestedTime: `${slotStart.format('HH:mm')} - ${slotEnd.format('HH:mm')}`,
          availabilitiesForDay: availabilitiesForDay?.map((a) => ({
            days: a.days,
            hours: `${a.startTime} - ${a.endTime}`,
          })) || [],
          hasAvailabilitiesForDay: (availabilitiesForDay?.length || 0) > 0,
        },
      };
    }

    return { available: true };
  }

  private isTimeInScheduleAvailabilities(
    slotStart: dayjs.Dayjs,
    slotEnd: dayjs.Dayjs,
  ): boolean {


    if (

      !this.availabilities ||
      this.availabilities.length === 0
    ) {
      return false;
    }

    const dayOfWeek = slotStart.day();


    // Windows that start today, plus windows from YESTERDAY that run past
    // midnight (e.g. Saturday 16:00-02:00 covers Sunday 00:00-02:00). The
    // latter were ignored, so every post-midnight slot was unbookable.
    const previousDay = (dayOfWeek + 6) % 7;
    const candidates: Array<{ avail: Availability; anchor: dayjs.Dayjs }> = [
      ...this.availabilities
        .filter((avail) => avail.days.includes(dayOfWeek))
        .map((avail) => ({ avail, anchor: slotStart })),
      ...this.availabilities
        .filter(
          (avail) =>
            avail.days.includes(previousDay) && avail.endTime <= avail.startTime,
        )
        .map((avail) => ({ avail, anchor: slotStart.subtract(1, 'day') })),
    ];

    if (candidates.length === 0) {
      return false;
    }

    return candidates.some(({ avail, anchor }) => {
      const [startHour, startMinute] = avail.startTime.split(':').map(Number);
      const [endHour, endMinute] = avail.endTime.split(':').map(Number);

      const availStart = anchor.hour(startHour).minute(startMinute).second(0);
      let availEnd = anchor.hour(endHour).minute(endMinute).second(0);

      // Matches Availability.getSlots: an equal start and end is a 24-hour
      // window, not an empty one.
      if (availEnd.isSameOrBefore(availStart)) {
        availEnd = availEnd.add(1, 'day');
      }

      return (
        slotStart.isSameOrAfter(availStart) && slotEnd.isSameOrBefore(availEnd)
      );
    });
  }



  getSlots(
    bookings: Booking[],
    reservedSlots: SlotReservation[] = [],
    { from, to, duration }: { from: Date; to: Date; duration: number },
  ): Slot[] {
    const slots: Slot[] = [];

    let currentDate = dayjs.tz(from, this.timeZone).startOf('day');
    const endDate = dayjs.tz(to, this.timeZone).endOf('day');

    while (currentDate.isBefore(endDate)) {
      const dayOfWeek = currentDate.day();
      const availabilitiesForDay = this.availabilities.filter((a) =>
        a.days.includes(dayOfWeek),
      );

      for (const availability of availabilitiesForDay) {
        const timeSlots = availability.getSlots(
          currentDate,
          duration,
        );

        for (const { start, end } of timeSlots) {
          const { available } = this.checkSlotAvailability(
            start,
            end,
            bookings,
            reservedSlots,
          );

          // Availability.getSlots already rolls `start` onto the next day
          // when the window crosses midnight (18:00-02:00), so formatting it
          // carries that day forward. Without a date the caller only saw
          // "01:00" and attributed it to the opening day, booking the wrong
          // night and showing next-day slots as free.
          slots.push({
            date: start.format('YYYY-MM-DD'),
            startTime: start.format('HH:mm'),
            endTime: end.format('HH:mm'),
            available,
          });
        }
      }

      currentDate = currentDate.add(1, 'day');
    }

    return slots;
  }


  getDaysAvailability(
    bookings: Booking[],
    reservedSlots: SlotReservation[] = [],
    { from, to, duration }: { from: Date; to: Date; duration: number },
  ): { availableDays: number[]; unavailableDays: number[] } {
    const availableDays: number[] = [];
    const unavailableDays: number[] = [];

    const startDate = dayjs.tz(from, this.timeZone).startOf('day');
    const endDate = dayjs.tz(to, this.timeZone).endOf('day');
    const today = dayjs().tz(this.timeZone).startOf('day');

    let dayToCheck = startDate.clone();

    while (dayToCheck.isBefore(endDate) || dayToCheck.isSame(endDate, 'day')) {
      if (dayToCheck.isBefore(today)) {
        unavailableDays.push(dayToCheck.date());
        dayToCheck = dayToCheck.add(1, 'day');
        continue;
      }

      const dayOfWeek = dayToCheck.day();
      const availabilitiesForDay = this.availabilities.filter((a) =>
        a.days.includes(dayOfWeek),
      );

      if (availabilitiesForDay.length > 0) {
        let hasAvailableSlot = false;

        for (const availability of availabilitiesForDay) {
          const timeSlots = availability.getSlots(
            dayToCheck,
            duration,
          );

          for (const { start, end } of timeSlots) {
            const isPast = start.isBefore(dayjs().tz(this.timeZone));
            const isReserved = this.checkSlotOverlapWithBooking(
              start,
              end,
              bookings,
            );
            const isTemporarilyReserved = this.checkSlotOverlapWithReservedSlots(
              start,
              end,
              reservedSlots,
            );

            if (!isPast && !isReserved && !isTemporarilyReserved) {
              hasAvailableSlot = true;
              break;
            }
          }

          if (hasAvailableSlot) break;
        }

        if (hasAvailableSlot) {
          availableDays.push(dayToCheck.date());
        } else {
          unavailableDays.push(dayToCheck.date());
        }
      } else {
        unavailableDays.push(dayToCheck.date());
      }

      dayToCheck = dayToCheck.add(1, 'day');
    }

    return { availableDays, unavailableDays };
  }

}
