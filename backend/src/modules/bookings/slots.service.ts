import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { BookingEventType } from './entities/event.entity';
import { SlotReservation } from './entities/slot-reservation.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { BOOKING } from './booking.constants';
import { dayjs } from '../shared/dayjs';
import { v4 as uuidv4 } from 'uuid';
import { DistributedLockService } from 'src/common/distributed-lock.service';

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(SlotReservation)
    private readonly slotReservationRepository: Repository<SlotReservation>,
    private readonly eventEmitter: EventEmitter2,
    private readonly lockService: DistributedLockService,
  ) { }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredReservationsCleanup(): Promise<void> {
    // @nestjs/schedule fires on every replica; the lock keeps this to one.
    await this.lockService.runExclusively(
      'slots:cleanup-expired-reservations',
      5 * 60 * 1000,
      async () => {
        const result = await this.slotReservationRepository.delete({
          expiresAt: LessThan(new Date()),
        });

        if (result.affected > 0) {
          this.logger.log(`Cleaned up ${result.affected} expired slot reservations`);
        }
      },
    );
  }

  // Safety net for bookings whose start/end jobs were missed (worker
  // Safety net for bookings whose start/end jobs were missed (worker
  // downtime, booking created after startDate, etc.): once endDate has
  // passed, a booking must not stay pending/in_progress forever.
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiredBookingsCompletion(): Promise<void> {
    // Without the lock, every replica completes the same bookings and emits
    // duplicate ENDED events — which credit tenant revenue, so duplicates are
    // a money problem, not just noisy notifications.
    await this.lockService.runExclusively(
      'slots:complete-expired-bookings',
      9 * 60 * 1000,
      () => this.completeExpiredBookings(),
    );
  }

  private async completeExpiredBookings(): Promise<void> {
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
      // The sweep is the fallback for a missed BOOKING_END job. Everything
      // that job triggers through ENDED (releasing the vendor's held revenue,
      // stats) must run here too, or swept bookings' money stayed "pending"
      // forever.
      //
      // Settle the organiser's hold FIRST (awaited, so it finishes before
      // ENDED releases revenue). A split match whose 30-minute settlement job
      // never ran — the usual case when it was created close to kick-off —
      // otherwise let the Stripe authorisation expire uncaptured.
      try {
        await this.eventEmitter.emitAsync(BookingEventType.SETTLE_PENDING, {
          booking,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to settle pending payments for swept booking ${booking.id}`,
          error,
        );
      }

      this.eventEmitter.emit(BookingEventType.ENDED, { booking });
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

    // Fast path: reject an obviously-taken slot without hitting the constraint.
    // This is only an optimisation — it is NOT what makes the operation safe.
    // The previous implementation relied on `SELECT ... FOR UPDATE` here, but
    // FOR UPDATE locks matching rows, and a free slot matches zero rows, so it
    // took no lock at all: two concurrent bookers both saw "free" and both
    // inserted. The exclusion constraint added in migration
    // 1790000000000-money-precision-and-booking-integrity is the real guarantee.
    const existingReservation = await this.slotReservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.courtId = :courtId', { courtId })
      .andWhere('reservation.startDate < :endDate', { endDate })
      .andWhere('reservation.endDate > :startDate', { startDate })
      .andWhere('reservation.expiresAt > :now', { now: new Date() })
      .getOne();

    if (existingReservation) {
      // A customer's OWN hold must not lock them out. Closing the Stripe sheet
      // and tapping Pay again hit this branch and returned "slot already
      // reserved" for the full 10-minute TTL, on a slot nobody else held.
      // isSlotReservedByOther already excludes the caller; this did not.
      if (existingReservation.userId === userId) {
        if (
          existingReservation.startDate.getTime() === startDate.getTime() &&
          existingReservation.endDate.getTime() === endDate.getTime()
        ) {
          // Same slot: extend their hold and let them retry payment.
          existingReservation.expiresAt = dayjs()
            .add(BOOKING.SLOT_RESERVATION_TTL_SECONDS, 'seconds')
            .toDate();
          await this.slotReservationRepository.save(existingReservation);
          return true;
        }

        // Same customer, overlapping but different slot: they changed their
        // selection, so release the stale hold rather than blocking them.
        await this.slotReservationRepository.delete({
          id: existingReservation.id,
        });
      } else {
        return false;
      }
    }

    const reservation = new SlotReservation();
    reservation.id = uuidv4();
    reservation.courtId = courtId;
    reservation.userId = userId;
    reservation.startDate = startDate;
    reservation.endDate = endDate;
    reservation.expiresAt = dayjs().add(BOOKING.SLOT_RESERVATION_TTL_SECONDS, 'seconds').toDate();

    try {
      await this.slotReservationRepository.save(reservation);
    } catch (error) {
      // 23P01 = exclusion_violation: another request won the race between the
      // check above and this insert. That is a normal "slot taken" outcome for
      // the caller, not a server error.
      if ((error as { code?: string })?.code === '23P01') {
        this.logger.log(
          `[BOOKING_FLOW] Slot reservation lost a race - courtId: ${courtId}, startDate: ${startDate.toISOString()}`,
        );
        return false;
      }
      throw error;
    }

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
