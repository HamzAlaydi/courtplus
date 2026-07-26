import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { SlotReservation } from './entities/slot-reservation.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { BOOKING } from './booking.constants';
import { dayjs } from '../shared/dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(SlotReservation)
    private readonly slotReservationRepository: Repository<SlotReservation>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredReservationsCleanup(): Promise<void> {
    const result = await this.slotReservationRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    if (result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} expired slot reservations`);
    }
  }

  // Safety net for bookings whose start/end jobs were missed (worker
  // Safety net for bookings whose start/end jobs were missed (worker
  // downtime, booking created after startDate, etc.): once endDate has
  // passed, a booking must not stay pending/in_progress forever.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredBookingsCompletion(): Promise<void> {
    // Fetch first (court is needed for the rate-reminder payload), then
    // complete in bulk. Batched to keep the sweep light.
    const expiredBookings = await this.bookingsRepository.find({
      where: {
        endDate: LessThan(new Date()),
        status: In([BookingStatus.PENDING, BookingStatus.IN_PROGRESS]),
      },
      relations: ['court'],
      take: 100,
    });

    if (expiredBookings.length === 0) {
      return;
    }

    const result = await this.bookingsRepository.update(
      { id: In(expiredBookings.map((booking) => booking.id)) },
      { status: BookingStatus.COMPLETED },
    );

    this.logger.log(
      `Marked ${result.affected} expired bookings as completed`,
    );

    for (const booking of expiredBookings) {
      try {
        await this.notifyRateReminder(booking);
      } catch (error) {
        this.logger.warn(
          `Failed to send rate reminder for booking ${booking.id}`,
          error,
        );
      }
    }
  }

  // Emitted instead of a direct NotificationsService call to avoid a
  // module-level DI cycle (BookingsModule <-> NotificationsModule).
  private notifyRateReminder(booking: Booking): void {
    if (!booking.userId) {
      return;
    }
    this.eventEmitter.emit(BookingEventType.ENDED_SWEEP, { booking });
  }

  async reserveSlot(
    courtId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<boolean> {
    await this.cleanupExpiredReservations();

    const existingReservation = await this.slotReservationRepository
      .createQueryBuilder('reservation')
      .setLock('pessimistic_write')
      .where('reservation.courtId = :courtId', { courtId })
      .andWhere('reservation.startDate < :endDate', { endDate })
      .andWhere('reservation.endDate > :startDate', { startDate })
      .andWhere('reservation.expiresAt > :now', { now: new Date() })
      .getOne();

    if (existingReservation) {
      return false;
    }

    const reservation = new SlotReservation();
    reservation.id = uuidv4();
    reservation.courtId = courtId;
    reservation.userId = userId;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    reservation.expiresAt = dayjs().add(BOOKING.SLOT_RESERVATION_TTL_SECONDS, 'seconds').toDate();

    await this.slotReservationRepository.save(reservation);

    return true;
  }

  async releaseSlotReservation(
    courtId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<void> {
    await this.slotReservationRepository.delete({
      courtId,
      startDate,
      endDate,
      userId,
    });
  }

  async isSlotReservedByOther(
    courtId: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<boolean> {
    const reservation = await this.slotReservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.courtId = :courtId', { courtId })
      .andWhere('reservation.startDate < :endDate', { endDate })
      .andWhere('reservation.endDate > :startDate', { startDate })
      .andWhere('reservation.expiresAt > :now', { now: new Date() })
      .andWhere('reservation.userId != :userId', { userId })
      .getOne();

    return !!reservation;
  }

  async getTemporarilyReservedSlots(
    courtId: string,
    from: Date,
    to: Date,
  ): Promise<SlotReservation[]> {
    const reservations = await this.slotReservationRepository.find({
      where: {
        courtId,
        startDate: LessThan(to),
        endDate: MoreThan(from),
        expiresAt: MoreThan(new Date()),
      },
      select: ['startDate', 'endDate'],
    });

    return reservations;
  }

  async findBookingsInRange(
    courtId: string,
    from: Date,
    to: Date,
    options?: { lock?: boolean },
  ): Promise<Booking[]> {
    if (options?.lock) {
      return this.bookingsRepository
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.courtId = :courtId', { courtId })
        .andWhere('booking.startDate < :to', { to })
        .andWhere('booking.endDate > :from', { from })
        .andWhere('booking.status != :cancelled', {
          cancelled: BookingStatus.CANCELLED,
        })
        .getMany();
    }

    return this.bookingsRepository.find({
      where: {
        courtId,
        startDate: LessThan(to),
        endDate: MoreThan(from),
        status: Not(BookingStatus.CANCELLED),
      },
    });
  }

  async checkSlotAvailability(
    startDate: Date,
    endDate: Date,
    schedule: Schedule,
    options?: { lock?: boolean },
  ) {
    const bookings = await this.findBookingsInRange(
      schedule.courtId,
      startDate,
      endDate,
      options,
    );

    const slotStart = dayjs.tz(startDate, schedule.timeZone);
    const slotEnd = dayjs.tz(endDate, schedule.timeZone);

    return schedule.checkSlotAvailability(slotStart, slotEnd, bookings);
  }

  private async cleanupExpiredReservations(): Promise<void> {
    await this.slotReservationRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
