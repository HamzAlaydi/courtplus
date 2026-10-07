import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../reviews/entities/review.entity';
import { BookingStatus, Booking } from '../bookings/entities/booking.entity';
import { Court } from '../courts/entities/court.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantStatsDto } from './dto/tenant-stats.dto';
import {
  ChartStatsResponseDto,
  DataPoint,
} from './dto/chart-stats-response.dto';
import { OnEvent } from '@nestjs/event-emitter';
import type {
  BookingCreatedEventPayload,
  BookingCancelledEventPayload,
  BookingEndedEventPayload,
  BookingPaymentCapturedEventPayload,
  BookingPaymentRefundedEventPayload,
} from '../bookings/bookings.events';
import { BookingEventType } from '../bookings/entities/event.entity';
import { BranchesService } from '../branches/branches.service';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { dayjs } from '../shared/dayjs';
import { CourtEvent, CourtEventPayload } from '../courts/courts.events';
import {
  type BookmarkEvent,
  BookmarkEventType,
} from '../bookmarks/bookmark.events';
import { Bookmark, BookmarkType } from '../bookmarks/entities/bookmark.entity';
import { CourtsService } from '../courts/courts.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Court)
    private readonly courtsRepository: Repository<Court>,
    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
  ) { }

  async getTenantStats({
    tenantId,
    startDate,
    endDate,
  }: {
    tenantId: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TenantStatsDto> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const branches = await this.branchesRepository.find({
      where: { tenantId },
      select: ['id'],
    });

    if (branches.length === 0) {
      return this.getEmptyStats();
    }

    const branchIds = branches.map((branch) => branch.id);
    const allCourtIds: string[] = [];

    for (const branchId of branchIds) {
      const courts = await this.courtsRepository.find({
        where: { branchId },
        select: ['id'],
      });
      allCourtIds.push(...courts.map((court) => court.id));
    }

    const stats = await this.getStatsForCourts(allCourtIds, startDate, endDate);

    return {
      ...stats,
    };
  }

  private async getStatsForCourts(
    courtIds: string[],
    startDate?: Date,
    endDate?: Date,
  ): Promise<TenantStatsDto> {
    if (courtIds.length === 0) {
      return this.getEmptyStats();
    }

    const now = new Date();
    const defaultEndDate = endDate || now;
    const defaultStartDate =
      startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const bookingsQb = this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.courtId IN (:...courtIds)', { courtIds });

    if (startDate) {
      bookingsQb.andWhere('booking.startDate >= :startDate', { startDate });
    }
    if (endDate) {
      bookingsQb.andWhere('booking.startDate <= :endDate', { endDate });
    }

    const basicStats = await bookingsQb
      .clone()
      .leftJoin(
        'payments',
        'payment',
        'payment."bookingId" = booking.id AND payment.status = :capturedStatus',
      )
      .select([
        'COALESCE(SUM(payment.amount), 0) as revenue',
        // Postgres lowercases unquoted aliases - read this as row.totalbookings.
        'COUNT(DISTINCT booking.id) as totalbookings',
      ])
      .setParameter('capturedStatus', PaymentStatus.COMPLETED)
      .getRawOne();

    const upcomingBookings = await this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.status = :status', { status: BookingStatus.PENDING })
      .andWhere('booking.startDate > :now', { now: new Date() })
      .getCount();

    const revenueChart = await this.getRevenueChart(
      courtIds,
      defaultStartDate,
      defaultEndDate,
    );
    const reviewsChart = await this.getReviewsChart(
      courtIds,
      defaultStartDate,
      defaultEndDate,
    );
    const upcomingBookingsChart = await this.getUpcomingBookingsChart(
      courtIds,
      defaultStartDate,
      defaultEndDate,
    );
    const totalBookingsChart = await this.getTotalBookingsChart(
      courtIds,
      defaultStartDate,
      defaultEndDate,
    );

    return {
      totalRevenue: Number(basicStats.revenue) || 0,
      upcomingBookings,
      totalBookings: Number(basicStats.totalbookings) || 0,
      revenueChart,
      reviewsChart,
      upcomingBookingsChart,
      totalBookingsChart,
    };
  }

  /**
   * Revenue per day, keyed on WHEN THE MONEY WAS TAKEN.
   *
   * This used to group on `booking.startDate` — the day the match is played —
   * and then clip the range at `now`. Every payment captured for a future
   * booking therefore vanished from "Revenue - last 30 days": a venue that
   * sold ten sessions today for next month saw a flat zero, and the revenue
   * it did show was filed under the wrong day. On the live database that hid
   * 500 of 1,400 SAR.
   *
   * Cancelled bookings need no special case here: refunding flips the payment
   * row to `refunded`, so the `completed` filter already excludes it. That
   * also fixes the old query's blind spot, where a booking cancelled without
   * a refund still counted its money.
   */
  private async getRevenueChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .innerJoin(
        'payments',
        'payment',
        'payment."bookingId" = booking.id AND payment.status = :capturedStatus',
      )
      .select([
        'DATE(payment."createdAt") as date',
        'SUM(payment.amount) as revenue',
      ])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('payment."createdAt" >= :startDate', { startDate })
      .andWhere('payment."createdAt" <= :endDate', { endDate })
      .setParameter('capturedStatus', PaymentStatus.COMPLETED)
      .groupBy('DATE(payment."createdAt")')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      points: this.fillMissingDays(result, 'revenue', startDate, endDate),
    };
  }

  private async getReviewsChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('bookings', 'booking', 'booking.id = review."bookingId"')
      .select(['DATE(review.createdAt) as date', 'COUNT(review.id) as count'])
      .where('booking."courtId" IN (:...courtIds)', { courtIds })
      .andWhere('review.createdAt >= :startDate', { startDate })
      .andWhere('review.createdAt <= :endDate', { endDate })
      .groupBy('DATE(review.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const points: DataPoint[] = result.map((row) => ({
      x: this.formatDate(new Date(row.date)),
      y: Number(row.count) || 0,
    }));

    return { points };
  }

  private async getUpcomingBookingsChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select(['DATE(booking.createdAt) as date', 'COUNT(booking.id) as count'])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.status = :status', { status: BookingStatus.PENDING })
      .andWhere('booking.startDate > booking.createdAt')
      .andWhere('booking.createdAt >= :startDate', { startDate })
      .andWhere('booking.createdAt <= :endDate', { endDate })
      .groupBy('DATE(booking.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const points: DataPoint[] = result.map((row) => ({
      x: this.formatDate(new Date(row.date)),
      y: Number(row.count) || 0,
    }));

    return { points };
  }

  /**
   * Bookings TAKEN per day, so it sits beside the revenue chart and answers
   * the same question about the same day.
   *
   * Two changes from the original. It groups on `createdAt` rather than
   * `startDate`, which previously meant the two cards were plotting different
   * things — one "sessions scheduled", the other "money earned" — and looked
   * broken whenever they disagreed. And it now excludes cancelled bookings,
   * which the revenue side already did: on the live database this card was
   * reporting five bookings on a day where every single one had been
   * cancelled, right next to a revenue card correctly showing zero.
   */
  private async getTotalBookingsChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select([
        'DATE(booking.createdAt) as date',
        'COUNT(booking.id) as count',
      ])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.createdAt >= :startDate', { startDate })
      .andWhere('booking.createdAt <= :endDate', { endDate })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .groupBy('DATE(booking.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      points: this.fillMissingDays(result, 'count', startDate, endDate),
    };
  }

  /**
   * Turns sparse grouped rows into one point per day across the whole range.
   *
   * Without this a range containing a single day of activity produced a
   * single point, which the dashboard's line chart draws as a lone dot with
   * no line at all — it reads as "the chart is broken". Gaps between days
   * were also joined straight across, implying activity that never happened.
   */
  private fillMissingDays(
    rows: Array<Record<string, unknown>>,
    valueKey: string,
    startDate: Date,
    endDate: Date,
  ): DataPoint[] {
    const byDay = new Map<string, number>();
    for (const row of rows) {
      byDay.set(
        this.formatDate(new Date(row.date as string)),
        Number(row[valueKey]) || 0,
      );
    }

    const points: DataPoint[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(endDate);
    last.setHours(0, 0, 0, 0);

    // Guard against an inverted or absurd range producing an unbounded loop.
    for (let guard = 0; cursor <= last && guard < 400; guard += 1) {
      const key = this.formatDate(cursor);
      points.push({ x: key, y: byDay.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getEmptyStats(): TenantStatsDto {
    return {
      totalRevenue: 0,
      upcomingBookings: 0,
      totalBookings: 0,
      revenueChart: {
        points: [],
      },
      reviewsChart: {
        points: [],
      },
      upcomingBookingsChart: {
        points: [],
      },
      totalBookingsChart: {
        points: [],
      },
    };
  }

  @OnEvent(BookingEventType.CREATED)
  async handleBookingCreated({ booking }: BookingCreatedEventPayload) {
    try {
      await this.updateBranchStatsForBookingCreated(booking);
      await this.updateCourtStatsForBookingCreated(booking);
    } catch (error) {
      this.logger.error('Failed to update stats for booking created', error);
    }
  }

  @OnEvent(BookingEventType.CANCELLED)
  async handleBookingCancelled({ booking }: BookingCancelledEventPayload) {
    try {
      await this.updateBranchStatsForBookingCancelled(booking);
      await this.updateCourtStatsForBookingCancelled(booking);
    } catch (error) {
      this.logger.error('Failed to update stats for booking cancelled', error);
    }
  }

  // Only CANCELLED took a match back out of the branch's open-match counter,
  // so a match that was actually played stayed counted as a pending open match
  // forever.
  @OnEvent(BookingEventType.ENDED)
  async handleBookingEnded({ booking }: BookingEndedEventPayload) {
    try {
      await this.updateBranchStatsForBookingEnded(booking);
    } catch (error) {
      this.logger.error('Failed to update stats for booking ended', error);
    }
  }

  @OnEvent(BookingEventType.PAYMENT_CAPTURED)
  async handlePaymentCaptured({
    booking,
    amount,
    paymentId,
  }: BookingPaymentCapturedEventPayload) {
    try {
      const capturedAmount = Number(amount);
      if (
        !booking?.courtId ||
        !Number.isFinite(capturedAmount) ||
        capturedAmount <= 0
      ) {
        this.logger.warn(
          `Skipping revenue stats for captured payment - paymentId: ${paymentId}, courtId: ${booking?.courtId}, amount: ${amount}`,
        );
        return;
      }

      const branchId = await this.branchesService.getBranchIdFromCourtId(
        booking.courtId,
      );

      await this.courtsService.increment(
        booking.courtId,
        'totalRevenue',
        capturedAmount,
      );

      if (branchId) {
        await this.branchesService.updateMatchStats(branchId, {
          totalRevenue: capturedAmount,
        });
      }
    } catch (error) {
      this.logger.error('Failed to update stats for payment captured', error);
    }
  }

  @OnEvent(BookingEventType.PAYMENT_REFUNDED)
  async handlePaymentRefunded({
    bookingId,
    amount,
    paymentId,
  }: BookingPaymentRefundedEventPayload) {
    try {
      const refundedAmount = Number(amount);
      if (
        !bookingId ||
        !Number.isFinite(refundedAmount) ||
        refundedAmount <= 0
      ) {
        this.logger.warn(
          `Skipping revenue stats for refunded payment - paymentId: ${paymentId}, bookingId: ${bookingId}, amount: ${amount}`,
        );
        return;
      }

      const booking = await this.bookingsRepository.findOne({
        where: { id: bookingId },
        select: ['id', 'courtId'],
      });
      if (!booking) return;

      const branchId = await this.branchesService.getBranchIdFromCourtId(
        booking.courtId,
      );

      await this.courtsService.decrement(
        booking.courtId,
        'totalRevenue',
        refundedAmount,
      );

      if (branchId) {
        await this.branchesService.updateMatchStats(branchId, {
          totalRevenue: -refundedAmount,
        });
      }
    } catch (error) {
      this.logger.error('Failed to update stats for payment refunded', error);
    }
  }

  private async updateBranchStatsForBookingCreated(booking: Booking) {
    const branchId = await this.branchesService.getBranchIdFromCourtId(
      booking.courtId,
    );
    if (!branchId) return;

    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isCurrentMonth = bookingDate.isSame(now, 'month');
    const isFuture = bookingDate.isAfter(now);

    const stats = {
      totalBookings: 1,
      minutesBooked: booking.duration,
      ...(isCurrentMonth && { currentMonthBookings: 1 }),
      ...(isFuture && { upcomingBookings: 1 }),
      // The open-match counter was only ever going to be decremented, so it
      // sat at zero for every branch. Count the match in when it is created.
      ...(booking.open && { totalOpenBookings: 1 }),
    };

    await this.branchesService.updateMatchStats(branchId, stats);
  }

  private async updateBranchStatsForBookingCancelled(booking: Booking) {
    const branchId = await this.branchesService.getBranchIdFromCourtId(
      booking.courtId,
    );
    if (!branchId) return;

    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isCurrentMonth = bookingDate.isSame(now, 'month');
    const isFuture = bookingDate.isAfter(now);

    const stats: {
      totalBookings?: number;
      totalRevenue?: number;
      minutesBooked?: number;
      currentMonthBookings?: number;
      currentMonthRevenue?: number;
      upcomingBookings?: number;
      totalOpenBookings?: number;
    } = {
      totalBookings: -1,
      minutesBooked: -booking.duration,
    };

    if (isCurrentMonth) {
      stats.currentMonthBookings = -1;
    }
    if (isFuture) {
      stats.upcomingBookings = -1;
    }
    // A cancelled open match is no longer looking for players either.
    if (booking.open) {
      stats.totalOpenBookings = -1;
    }

    // Revenue is NOT decremented here: revenue is tracked per captured
    // payment, and the cancel flow refunds those payments - each refund emits
    // PAYMENT_REFUNDED, which decrements revenue by the refunded amount.

    await this.branchesService.updateMatchStats(branchId, stats);
  }

  private async updateBranchStatsForBookingEnded(booking: Booking) {
    if (!booking?.open) return;

    // The court counts open matches too now, so it has to release them on the
    // same event or it would only ever climb.
    await this.courtsService.decrement(
      booking.courtId,
      'totalOpenBookings',
      1,
    );

    const branchId = await this.branchesService.getBranchIdFromCourtId(
      booking.courtId,
    );
    if (!branchId) return;

    // Goes through the same helper as creation and cancellation, which floors
    // at zero, so matches that were already open before this counter worked
    // cannot drive a branch negative.
    await this.branchesService.updateMatchStats(branchId, {
      totalOpenBookings: -1,
    });
  }

  private async updateCourtStatsForBookingCreated(booking: Booking) {
    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isFuture = bookingDate.isAfter(now);

    // The branch has always counted this; the court never did, so
    // courts.totalBookings sat at 0 forever and the mobile court page
    // rendered "0 sessions" for a court with a season of history.
    await this.courtsService.increment(booking.courtId, 'totalBookings', 1);
    await this.courtsService.increment(
      booking.courtId,
      'minutesBooked',
      booking.duration,
    );
    if (booking.open) {
      await this.courtsService.increment(
        booking.courtId,
        'totalOpenBookings',
        1,
      );
    }
    if (isFuture) {
      await this.courtsService.increment(
        booking.courtId,
        'upcomingBookings',
        1,
      );
    }
  }

  private async updateCourtStatsForBookingCancelled(booking: Booking) {
    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isFuture = bookingDate.isAfter(now);

    await this.courtsService.decrement(booking.courtId, 'totalBookings', 1);
    await this.courtsService.decrement(
      booking.courtId,
      'minutesBooked',
      booking.duration,
    );
    if (booking.open) {
      await this.courtsService.decrement(
        booking.courtId,
        'totalOpenBookings',
        1,
      );
    }
    if (isFuture) {
      await this.courtsService.decrement(
        booking.courtId,
        'upcomingBookings',
        1,
      );
    }
    // Revenue decrements are handled per refunded payment (PAYMENT_REFUNDED).
  }

  private async updateBookmarkCounts(bookmark: Bookmark, value: number) {
    switch (bookmark.type) {
      case BookmarkType.COURT:
        await this.courtsService.increment(
          bookmark.resourceId,
          'bookmarksCount',
          value,
        );
        break;
      case BookmarkType.BRANCH:
        await this.branchesService.increment(
          bookmark.resourceId,
          'bookmarksCount',
          value,
        );
        break;
    }
  }

  @OnEvent(CourtEvent.COURT_CREATED)
  private handleCourtCreated({ court }: CourtEventPayload) {
    this.branchesService.increment(court.branchId, 'courtsCount', 1);
  }

  @OnEvent(CourtEvent.COURT_UPDATED)
  private handleCourtUpdated(payload: CourtEventPayload) {
    this.logger.log('Court updated', payload);
  }

  @OnEvent(CourtEvent.COURT_DELETED)
  private handleCourtDeleted({ court }: CourtEventPayload) {
    this.branchesService.increment(court.branchId, 'courtsCount', -1);
  }

  @OnEvent(BookmarkEventType.CREATED)
  private async handleBookmarkCreated({ bookmark }: BookmarkEvent) {
    await this.updateBookmarkCounts(bookmark, 1);
  }

  @OnEvent(BookmarkEventType.DELETED)
  private async handleBookmarkDeleted({ bookmark }: BookmarkEvent) {
    await this.updateBookmarkCounts(bookmark, -1);
  }
}
