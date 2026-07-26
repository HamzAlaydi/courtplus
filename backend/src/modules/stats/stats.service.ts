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

  private async getRevenueChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .leftJoin(
        'payments',
        'payment',
        'payment."bookingId" = booking.id AND payment.status = :capturedStatus',
      )
      .select([
        'DATE(booking.startDate) as date',
        'COALESCE(SUM(payment.amount), 0) as revenue',
      ])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :startDate', { startDate })
      .andWhere('booking.startDate <= :endDate', { endDate })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
      .setParameter('capturedStatus', PaymentStatus.COMPLETED)
      .groupBy('DATE(booking.startDate)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const points: DataPoint[] = result.map((row) => ({
      x: this.formatDate(new Date(row.date)),
      y: Number(row.revenue) || 0,
    }));

    return { points };
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

  private async getTotalBookingsChart(
    courtIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ChartStatsResponseDto> {
    const result = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select(['DATE(booking.startDate) as date', 'COUNT(booking.id) as count'])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :startDate', { startDate })
      .andWhere('booking.startDate <= :endDate', { endDate })
      .groupBy('DATE(booking.startDate)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const points: DataPoint[] = result.map((row) => ({
      x: this.formatDate(new Date(row.date)),
      y: Number(row.count) || 0,
    }));

    return { points };
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

    // Revenue is NOT decremented here: revenue is tracked per captured
    // payment, and the cancel flow refunds those payments - each refund emits
    // PAYMENT_REFUNDED, which decrements revenue by the refunded amount.

    await this.branchesService.updateMatchStats(branchId, stats);
  }

  private async updateCourtStatsForBookingCreated(booking: Booking) {
    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isFuture = bookingDate.isAfter(now);

    await this.courtsService.increment(
      booking.courtId,
      'minutesBooked',
      booking.duration,
    );
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

    await this.courtsService.decrement(
      booking.courtId,
      'minutesBooked',
      booking.duration,
    );
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
