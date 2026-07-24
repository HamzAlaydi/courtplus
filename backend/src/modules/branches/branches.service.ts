import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  Repository,
} from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { ListBranchesDto } from './dto/list-branches.dto';
import { LocationsService } from './locations.service';
import type { SessionUser } from '../auth/@types/session';
import { AssetsService } from 'src/modules/assets/assets.service';
import {
  BRANCH_NOT_FOUND,
  BRANCH_CREATION_NOT_ALLOWED,
  NOT_ALLOWED,
  INVALID_BRANCH_STATUS_TRANSITION,
} from '../shared/error-codes';
import { AssetType } from '../assets/entities/asset.entity';
import { ListBranchesResponseDto } from './dto/list-branches-response.dto';
import { CourtsService } from '../courts/courts.service';
import { SchedulesService } from '../schedules/schedules.service';
import { UserType } from '../auth/@types/user.type';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { GetBranchDto } from './dto/get-branch.dto';
import { MonthStats } from './dto/month-stats.dto';
import { BookingStatus, Booking } from '../bookings/entities/booking.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';
import { dayjs } from '../shared/dayjs';
import { BranchEvent, BranchEventPayload } from './branch.events';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { runOnTransactionCommit, Transactional } from 'typeorm-transactional';
import { StaffRole } from '../staff/entities/enum';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly locationsService: LocationsService,
    private readonly assetsService: AssetsService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => BookmarksService))
    private readonly bookmarksService: BookmarksService,
    private readonly schedulesService: SchedulesService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
  ) { }

  @Transactional()
  async create(
    {
      placeId,
      coordinates,
      address,
      coverAssetId,
      logoAssetId,
      schedule: scheduleData,
      ...data
    }: CreateBranchDto,
    currentUser: SessionUser,
  ) {
    const availability = await this.tenantsService.getBranchCreationAvailability(currentUser.tenantId);

    // if (!availability.canCreate) {
    //   throw new ForbiddenException(BRANCH_CREATION_NOT_ALLOWED);
    // }


    let location;

    if (placeId) {
      location = await this.locationsService.addLocation(placeId);
    } else if (coordinates && address) {
      location = await this.locationsService.addLocationWithCoordinates({
        coordinates,
        name: data.name,
        address,
        country: undefined,
      });
    }

    const branchData: Partial<Branch> = {
      ...data,
      locationId: location.id,
      tenantId: currentUser.tenantId,
    };

    const branch = await this.branchRepository.save(branchData);

    if (coverAssetId) {
      const assets = await this.assetsService.assignAssets(
        coverAssetId,
        branch.id,
        AssetType.BranchCover,
      );
      branch.coverUrl = assets[0].url;
      await this.branchRepository.update(branch.id, {
        coverUrl: assets[0].url,
      });
    }

    if (logoAssetId) {
      const assets = await this.assetsService.assignAssets(
        logoAssetId,
        branch.id,
        AssetType.BranchLogo,
      );
      branch.logoUrl = assets[0].url;
      await this.branchRepository.update(branch.id, { logoUrl: assets[0].url });
    }

    await this.schedulesService.create(scheduleData, branch.id, true);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BranchEvent.BRANCH_CREATED, {
        branch,
      } as BranchEventPayload);
    });

    return branch;
  }
  async find(
    query: ListBranchesDto & {
      ids?: string[];
      options?: {
        include: {
          bookmarks?: boolean;
          stats?: boolean;
        };
      };
    },
    user: SessionUser,
  ) {
    const {
      search,
      lng,
      lat,
      placeId,
      radius,
      minRating,
      rating,
      page = 1,
      pageSize = 10,
      ids,
      options = {
        include: {
          bookmarks: false,
          stats: false,
        },
      },
    } = query;

    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.location', 'location')
      .leftJoinAndSelect('branch.schedule', 'schedule')
      .leftJoinAndSelect('schedule.availabilities', 'availabilities')
      .where('branch.deletedAt IS NULL');

    if (user.type === UserType.Staff) {
      queryBuilder.andWhere('branch.tenantId = :tenantId', {
        tenantId: user.tenantId,
      });

      if (user.role !== StaffRole.SUPER_ADMIN && user.role !== StaffRole.OWNER) {
        queryBuilder
          .innerJoin('branch.staff', 'staffMember')
          .andWhere('staffMember.stafferId = :stafferId', {
            stafferId: user.id,
          });
      }
    } else {
      // Customer-facing visibility: hide suspended branches and
      // branches of blocked tenants.
      queryBuilder.leftJoin('branch.tenant', 'tenant');
      queryBuilder.andWhere('branch.suspendedAt IS NULL');
      queryBuilder.andWhere('tenant.blockedAt IS NULL');
    }

    if (search) {
      queryBuilder.andWhere('branch.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (lng && lat) {
      const point: GeoJSON.Point = {
        type: 'Point',
        coordinates: [lng, lat],
      };

      queryBuilder.andWhere(
        `ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_GeomFromGeoJSON(:point), 4326)::geography,
          :radius
        )`,
        {
          point: JSON.stringify(point),
          radius,
        },
      );
    }

    if (placeId) {
      queryBuilder.andWhere('location.placeId = :placeId', {
        placeId,
      });
    }

    if (ids && ids.length > 0) {
      queryBuilder.andWhere('branch.id IN (:...ids)', { ids });
    }

    if (minRating) {
      queryBuilder.andWhere('branch.avgRating >= :minRating', {
        minRating,
      });
    }

    if (rating) {
      queryBuilder.andWhere(
        'branch.avgRating >= :ratingMin AND branch.avgRating < :ratingMax',
        {
          ratingMin: rating,
          ratingMax: rating + 1,
        },
      );
    }

    const [branches, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    let mappedBranches: Branch[] = branches;
    if (user.type === UserType.Customer) {
      if (options.include.bookmarks) {
        const branchIds = branches.map((branch) => branch.id);
        if (branchIds.length > 0) {
          const bookmarks = await this.bookmarksService.getBookmarkedResources(
            branchIds,
            user.id,
          );
          mappedBranches = branches.map((branch) => ({
            ...branch,
            isBookmarked: bookmarks.has(branch.id),
          }));
        }
      }
    }

    if (user.type === UserType.Staff || options.include.stats) {
      mappedBranches = await Promise.all(
        mappedBranches.map(async (branch) => {
          branch.monthStats = await this.getMonthStats(branch.id);
          return branch;
        }),
      );
    }

    return {
      items: mappedBranches,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        totalCount: total,
      },
    } satisfies ListBranchesResponseDto;
  }

  async findOne(id: string, user?: SessionUser, query?: GetBranchDto) {
    const where: FindOptionsWhere<Branch> = {
      id,
      deletedAt: IsNull(),
    };

    if (user?.type === UserType.Staff) {
      where.tenantId = user.tenantId;

      if (user.role !== StaffRole.SUPER_ADMIN && user.role !== StaffRole.OWNER) {
        where.staff = { id: user.id };
      }
    } else if (user?.type === UserType.Customer) {
      where.suspendedAt = IsNull();
      where.tenant = { blockedAt: IsNull() };
    }

    const branch = await this.branchRepository.findOne({
      where,
      relations: {
        location: true,
        schedule: {
          availabilities: true,
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }

    if (user?.type === UserType.Customer) {
      const bookmarks = await this.bookmarksService.getBookmarkedResources(
        [branch.id],
        user.id,
      );
      branch.isBookmarked = bookmarks.has(branch.id);
      if (query?.includeCourts) {
        const { items: courts } = await this.courtsService.findAll(
          {
            branchId: branch.id,
            page: 1,
            pageSize: 20,
          },
          user,
        );
        branch.courts = courts;
      }
    } else if (user) {
      branch.monthStats = await this.getMonthStats(branch.id);
    }

    return branch;
  }

  async findByIds(ids: string[], select?: FindOptionsSelect<Branch>) {
    return this.branchRepository.find({
      where: { id: In(ids) },
      select,
    });
  }

  @Transactional()
  async update(
    id: string,
    {
      placeId,
      coordinates,
      address,
      coverAssetId,
      logoAssetId,
      schedule: scheduleData,
      ...data
    }: UpdateBranchDto,
    currentUser: SessionUser,
  ) {
    const branch = await this.findOne(id, currentUser);
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }

    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(NOT_ALLOWED);
    }

    let location = null;

    if (placeId) {
      location = await this.locationsService.addLocation(placeId);
    } else if (coordinates && address) {
      location = await this.locationsService.addLocationWithCoordinates({
        coordinates,
        name: data.name || branch.name,
        address,
        country: undefined,
      });
    }

    const update: Partial<Branch> = {
      ...data,
    };

    if (location) {
      update.locationId = location.id;
    }

    if (coverAssetId) {
      const assets = await this.assetsService.assignAssets(
        coverAssetId,
        branch.id,
        AssetType.BranchCover,
      );
      update.coverUrl = assets[0].url;
    }

    if (logoAssetId) {
      const assets = await this.assetsService.assignAssets(
        logoAssetId,
        branch.id,
        AssetType.BranchLogo,
      );
      update.logoUrl = assets[0].url;
    }

    await this.branchRepository.update(id, update);

    if (scheduleData) {
      await this.schedulesService.update(branch.schedule.id, scheduleData);
    }

    const updatedBranch = await this.findOne(id, currentUser);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BranchEvent.BRANCH_UPDATED, {
        branch: updatedBranch,
      } as BranchEventPayload);
    });

    return updatedBranch;
  }

  @Transactional()
  async delete(id: string, currentUser: SessionUser) {
    const branch = await this.findOne(id, currentUser);
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }

    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You are not allowed to delete this branch');
    }

    await this.courtsService.deleteBranchCourts(id);

    await this.branchRepository.softDelete(id);

    this.eventEmitter.emit(BranchEvent.BRANCH_DELETED, {
      branch,
    } as BranchEventPayload);

    await this.invalidateMonthStatsCache(id);
  }

  async exists(id: string) {
    return this.branchRepository.exists({ where: { id, deletedAt: IsNull() } });
  }

  @Transactional()
  async suspend(id: string, reason: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }
    if (branch.suspendedAt) {
      throw new BadRequestException(INVALID_BRANCH_STATUS_TRANSITION);
    }
    await this.branchRepository.update(id, {
      suspendedAt: new Date(),
      suspendedReason: reason,
    });
    return this.branchRepository.findOne({ where: { id } });
  }

  @Transactional()
  async unsuspend(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }
    if (!branch.suspendedAt) {
      throw new BadRequestException(INVALID_BRANCH_STATUS_TRANSITION);
    }
    await this.branchRepository.update(id, {
      suspendedAt: null,
      suspendedReason: null,
    });
    return this.branchRepository.findOne({ where: { id } });
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.branchRepository.count({
      where: { tenantId, deletedAt: IsNull() },
    });
  }

  async getMonthStats(branchId: string): Promise<MonthStats> {
    const now = dayjs();
    const currentPeriod = now.format('YYYY-MM');
    const cacheKey = `branch-stats:${branchId}:${currentPeriod}`;

    const cachedStats = await this.cacheManager.get<MonthStats>(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const startOfMonth = now.startOf('month').toDate();
    const endOfMonth = now.endOf('month').toDate();

    const courtIds = await this.courtsService.findCourtIdsByBranch(branchId);

    if (courtIds.length === 0) {
      const emptyStats: MonthStats = {
        totalRevenue: 0,
        upcomingBookings: 0,
        totalBookings: 0,
      };

      const ttl = dayjs(endOfMonth).diff(now);
      await this.cacheManager.set(cacheKey, emptyStats, ttl);
      return emptyStats;
    }

    const revenueQuery = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :startOfMonth', { startOfMonth })
      .andWhere('booking.startDate <= :endOfMonth', { endOfMonth })
      .andWhere('booking.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatus.COMPLETED,
      })
      .select('SUM(booking.totalAmount)', 'totalRevenue');

    const upcomingBookingsQuery = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :now', { now: now.toDate() })
      .andWhere('booking.startDate <= :endOfMonth', { endOfMonth })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.IN_PROGRESS],
      });

    const totalBookingsQuery = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.courtId IN (:...courtIds)', { courtIds })
      .andWhere('booking.startDate >= :startOfMonth', { startOfMonth })
      .andWhere('booking.startDate <= :endOfMonth', { endOfMonth });

    const [revenueResult, upcomingBookings, totalBookings] = await Promise.all([
      revenueQuery.getRawOne(),
      upcomingBookingsQuery.getCount(),
      totalBookingsQuery.getCount(),
    ]);

    const totalRevenue = parseFloat(revenueResult?.totalRevenue || '0');

    const stats: MonthStats = {
      totalRevenue,
      upcomingBookings,
      totalBookings,
    };

    const ttl = dayjs(endOfMonth).diff(now);
    await this.cacheManager.set(cacheKey, stats, ttl);

    return stats;
  }

  async invalidateMonthStatsCache(branchId: string) {
    const now = dayjs();
    const currentPeriod = now.format('YYYY-MM');
    const cacheKey = `branch-stats:${branchId}:${currentPeriod}`;
    await this.cacheManager.del(cacheKey);
  }

  @Transactional()
  async increment(id: string, field: keyof Branch, value: number) {
    return this.branchRepository.increment({ id }, field, value);
  }

  @Transactional()
  async decrement(id: string, field: keyof Branch, value: number) {
    return this.branchRepository.decrement({ id }, field, value);
  }

  @Transactional()
  async updateMatchStats(
    branchId: string,
    stats: {
      totalBookings?: number;
      totalRevenue?: number;
      minutesBooked?: number;
      currentMonthBookings?: number;
      currentMonthRevenue?: number;
      upcomingBookings?: number;
    },
  ) {
    const updates: Array<{ field: keyof Branch; value: number }> = [];

    if (stats.totalBookings !== undefined) {
      updates.push({ field: 'totalBookings', value: stats.totalBookings });
    }
    if (stats.totalRevenue !== undefined) {
      updates.push({ field: 'totalRevenue', value: stats.totalRevenue });
    }
    if (stats.minutesBooked !== undefined) {
      updates.push({ field: 'minutesBooked', value: stats.minutesBooked });
    }

    if (stats.upcomingBookings !== undefined) {
      updates.push({
        field: 'upcomingBookings',
        value: stats.upcomingBookings,
      });
    }

    if (updates.length > 0) {
      for (const update of updates) {
        if (update.value !== 0) {
          if (update.value > 0) {
            await this.increment(branchId, update.field, update.value);
          } else {
            await this.decrement(
              branchId,
              update.field as keyof Branch,
              Math.abs(update.value),
            );
          }
        }
      }

      await this.invalidateMonthStatsCache(branchId);
    }
  }

  @Transactional()
  async updateRating(branchId: string, rating: number, inc: boolean) {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      select: ['ratingStats'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }

    const { ratingStats } = branch;

    let totalCount = 0;
    let totalRating = 0;

    ratingStats[rating] = Math.max(
      0,
      (ratingStats[rating] || 0) + (inc ? 1 : -1),
    );

    Object.entries(ratingStats).forEach(([rating, count]) => {
      totalCount += count;
      totalRating += count * Number(rating);
    });

    const newAvgRating = totalCount > 0 ? totalRating / totalCount : 0;

    await this.branchRepository.update(branch.id, {
      avgRating: newAvgRating,
      reviewsCount: () => `GREATEST(0, "reviewsCount" + ${inc ? 1 : -1})`,
      ratingStats: () => `'${JSON.stringify(ratingStats)}'::jsonb`,
    });
  }

  async getBranchIdFromCourtId(courtId: string): Promise<string | null> {
    const court = await this.courtsService.findOne(courtId, { branch: true });
    return court?.branch?.id || null;
  }

  @OnEvent(BranchEvent.BRANCH_CREATED)
  private handleBranchCreated(event: BranchEventPayload) {
    this.logger.log('Branch created:', event);
  }

  @OnEvent(BranchEvent.BRANCH_UPDATED)
  private handleBranchUpdated(event: BranchEventPayload) {
    this.logger.log('Branch updated:', event);
  }

  @OnEvent(BranchEvent.BRANCH_DELETED)
  private handleBranchDeleted(event: BranchEventPayload) {
    this.logger.log('Branch deleted:', event);
  }
}
