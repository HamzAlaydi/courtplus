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
  BookingPaymentCompletedEventPayload,
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
      .select([
        'SUM(booking.hourlyRate * booking.duration / 60) as revenue',
        'COUNT(booking.id) as totalBookings',
      ])
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
      totalBookings: Number(basicStats.totalBookings) || 0,
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
      .select([
        'DATE(booking.startDate) as date',
        'SUM(booking.hourlyRate * booking.duration / 60) as revenue',
      ])
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :startDate', { startDate })
      .andWhere('booking.startDate <= :endDate', { endDate })
      .andWhere('booking.status != :cancelled', {
        cancelled: BookingStatus.CANCELLED,
      })
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
      .select(['DATE(review.createdAt) as date', 'COUNT(review.id) as count'])
      .where('review.courtId IN (:...courtIds)', { courtIds })
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
    } catch (error) {
      this.logger.error('Failed to update stats for booking created', error);
    }
  }

  @OnEvent(BookingEventType.CANCELLED)
  async handleBookingCancelled({ booking }: BookingCancelledEventPayload) {
    try {
      await this.updateBranchStatsForBookingCancelled(booking);
    } catch (error) {
      this.logger.error('Failed to update stats for booking cancelled', error);
    }
  }

  @OnEvent(BookingEventType.PAYMENT_COMPLETED)
  async handlePaymentCompleted({
    booking,
  }: BookingPaymentCompletedEventPayload) {
    try {
      await this.updateBranchStatsForPaymentCompleted(booking);
    } catch (error) {
      this.logger.error('Failed to update stats for payment completed', error);
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

    if (booking.paymentStatus === PaymentStatus.COMPLETED) {
      stats.totalRevenue = -booking.totalAmount;
      if (isCurrentMonth) {
        stats.currentMonthRevenue = -booking.totalAmount;
      }
    }

    await this.branchesService.updateMatchStats(branchId, stats);
  }

  private async updateBranchStatsForPaymentCompleted(booking: Booking) {
    const branchId = await this.branchesService.getBranchIdFromCourtId(
      booking.courtId,
    );
    if (!branchId) return;

    const now = dayjs();
    const bookingDate = dayjs(booking.startDate);
    const isCurrentMonth = bookingDate.isSame(now, 'month');

    const stats = {
      totalRevenue: booking.totalAmount,
      ...(isCurrentMonth && { currentMonthRevenue: booking.totalAmount }),
    };

    await this.branchesService.updateMatchStats(branchId, stats);
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
