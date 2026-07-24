import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';
import { FindOptionsSelect, In, IsNull, Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BranchesService } from '../branches/branches.service';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { AssetsService } from 'src/modules/assets/assets.service';
import { ListCourtsDto, Sort } from './dto/list-courts.dto';
import { ListCourtsResponseDto } from './dto/list-courts-response.dto';
import { AssetType } from '../assets/entities/asset.entity';
import {
  NOT_ALLOWED,
  COURT_NOT_FOUND,
  BRANCH_NOT_FOUND,
} from '../shared/error-codes';
import { LocationsService } from 'src/modules/branches/locations.service';
import { UserLocation } from 'src/decorators/location.decorator';
import { SchedulesService } from '../schedules/schedules.service';
import { UserType } from '../auth/@types/user.type';
import { SortDirection } from 'src/common/sort';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { SlotsService } from '../bookings/slots.service';
import { dayjs } from 'src/modules/shared/dayjs';
import { CourtEvent } from './courts.events';
import { CourtEventPayload } from './courts.events';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { Schedule } from '../schedules/entities/schedule.entity';
@Injectable()
export class CourtsService {
  private readonly logger = new Logger(CourtsService.name);
  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    private readonly assetsService: AssetsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly locationsService: LocationsService,
    private readonly schedulesService: SchedulesService,
    @Inject(forwardRef(() => BookmarksService))
    private readonly bookmarksService: BookmarksService,
    @Inject(forwardRef(() => SlotsService))
    private readonly slotsService: SlotsService,
  ) { }

  @Transactional()
  async create(
    {
      images,
      videoAssetId,
      placeId,
      schedule: scheduleData,
      ...data
    }: CreateCourtDto,
    currentUser: SessionUser,
  ) {
    const branch = await this.branchesService.findOne(
      data.branchId,
      currentUser,
    );
    if (!branch) {
      throw new NotFoundException(BRANCH_NOT_FOUND);
    }
    if (branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(NOT_ALLOWED);
    }

    const location = placeId
      ? await this.locationsService.addLocation(placeId)
      : null;

    const court = await this.courtRepository.save({
      ...data,
      branchId: branch.id,
      locationId: location?.id,
    });

    if (videoAssetId) {
      await this.assetsService.assignAssets(
        videoAssetId,
        court.id,
        AssetType.CourtVideo,
      );
    }

    if (images?.length) {
      await this.assetsService.assignAssets(
        images,
        court.id,
        AssetType.CourtImage,
      );
    }

    if (scheduleData) {
      await this.schedulesService.create(scheduleData, court.id, false);
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(CourtEvent.COURT_CREATED, {
        court,
        branch,
      });
    });

    return this.findOne(
      court.id,
      {
        branch: true,
        schedule: true,
        assets: true,
        location: true,
      },
      currentUser,
    );
  }

  async findAll(
    query: ListCourtsDto & {
      ids?: string[];
      options?: {
        include: {
          branch?: boolean;
          bookmarks?: boolean;
        };
      };
    } = {
        options: {
          include: {
            branch: true,
          },
        },
      },
    user: SessionUser,
    location?: UserLocation,
  ) {
    const {
      search,
      branchId,
      sport,
      ids,
      lng,
      lat,
      placeId,
      radius,
      status,
      minRating,
      rating,
      page = 1,
      pageSize = 10,
      sortBy,
      sortDirection,
      startAt,
      duration = 60,
      options = {
        include: {
          branch: false,
          bookmarks: false,
        },
      },
    } = query;
    const queryBuilder = this.courtRepository.createQueryBuilder('court');
    queryBuilder.leftJoinAndSelect('court.branch', 'branch');
    if (options.include.branch) {
      queryBuilder.leftJoinAndSelect('branch.location', 'branchLocation');
    } else {
      queryBuilder.leftJoin('branch.location', 'branchLocation');
    }

    queryBuilder
      .leftJoinAndMapOne(
        'branch.tenantPreferences',
        'tenant_preferences',
        'tenantPreferences',
        'tenantPreferences.tenantId = branch.tenantId',
      )
      .leftJoinAndSelect('court.location', 'location')
      .leftJoinAndMapMany(
        'court.assets',
        'assets',
        'assets',
        'assets.resourceId = court.id AND assets.type = :type',
        { type: AssetType.CourtImage },
      )
      .select([
        'court',
        'location.id',
        'location.name',
        'location.placeId',
        'location.address',
        'location.coordinates',
        'assets.id',
        'assets.mimeType',
        'assets.type',
        'assets.fileSize',
        'assets.position',
        'tenantPreferences.currency',
      ]);

    if (options.include.branch) {
      queryBuilder.addSelect([
        'branch.id',
        'branch.name',
        'branch.tenantId',
        'branchLocation.id',
        'branchLocation.name',
        'branchLocation.placeId',
        'branchLocation.address',
        'branchLocation.coordinates',
      ]);
    } else {
      queryBuilder.addSelect(['branch.id', 'branch.tenantId']);
    }
    queryBuilder.where('court.deletedAt IS NULL');

    if (user.type === UserType.Staff) {
      queryBuilder.andWhere('branch.tenantId = :tenantId', {
        tenantId: user.tenantId,
      });
    }

    if (search) {
      queryBuilder.andWhere('court.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (branchId) {
      queryBuilder.andWhere('court.branchId = :branchId', {
        branchId,
      });
    }

    if (sport) {
      queryBuilder.andWhere('court.sport IN (:...sport)', {
        sport,
      });
    }

    if (lng && lat) {
      queryBuilder.andWhere(
        `ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        {
          longitude: lng,
          latitude: lat,
          radius,
        },
      );
    }

    if (placeId) {
      queryBuilder.andWhere('location.placeId = :placeId', {
        placeId,
      });
    }

    if (status) {
      queryBuilder.andWhere('court.status = :status', {
        status,
      });
    }

    if (minRating) {
      queryBuilder.andWhere('court.avgRating >= :minRating', {
        minRating,
      });
    }

    if (rating) {
      queryBuilder.andWhere(
        'court.avgRating >= :ratingMin AND court.avgRating < :ratingMax',
        {
          ratingMin: rating,
          ratingMax: rating + 1,
        },
      );
    }

    if (sortBy) {
      switch (sortBy) {
        case Sort.HOURLY_RATE:
          queryBuilder.orderBy('court.hourlyRate', sortDirection);
          break;
        case Sort.RATING:
          queryBuilder.orderBy('court.avgRating', sortDirection);
          break;
        case Sort.NAME:
          queryBuilder.orderBy('court.name', sortDirection);
          break;
        default:
          queryBuilder.orderBy('court.createdAt', SortDirection.ASC);
      }
    }

    if (ids && ids.length > 0) {
      queryBuilder.andWhere('court.id IN (:...ids)', { ids });
    }

    if (startAt && duration) {
      const startDate = dayjs(startAt).toDate();
      const endDate = dayjs(startAt).add(duration, 'minutes').toDate();

      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('booking.courtId')
          .from('bookings', 'booking')
          .where('booking.status != :cancelledStatus')
          .andWhere('booking.startDate < :endDate')
          .andWhere('booking.endDate > :startDate')
          .getQuery();
        return `court.id NOT IN ${subQuery}`;
      });
      queryBuilder.setParameter('cancelledStatus', 'CANCELLED');
      queryBuilder.setParameter('startDate', startDate);
      queryBuilder.setParameter('endDate', endDate);
    }

    const [courts, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();


    console.log(JSON.stringify(courts, null, 2));

    const mappedCourts = await this.mapCourts(
      courts,
      {
        include: {
          branch: options.include.branch,
          bookmarks: options.include.bookmarks,
        },
      },
      user,
      location,
    );

    return {
      items: mappedCourts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        totalCount: total,
      },
    } satisfies ListCourtsResponseDto;
  }
  async mapCourts(
    courts: Court[],
    options: { include: { branch: boolean; bookmarks: boolean } },
    user?: SessionUser,
    location?: UserLocation,
    data?: Partial<Court>,
  ) {
    const courtIds = courts.map((court) => court.id);
    let bookmarks: Set<string> = new Set();
    if (options.include.bookmarks) {
      if (courtIds.length > 0) {
        bookmarks = await this.bookmarksService.getBookmarkedResources(
          courtIds,
          user.id,
        );
      }
    }

    return courts.map((court) => {
      let assets = court.assets
        .sort((a, b) => a.position - b.position)
        .map((asset) => ({
          ...asset,
          url: this.assetsService.getUrl(asset.id),
        }));
      const mainAsset = assets.length
        ? assets.find((asset) => asset.type === AssetType.CourtImage)
        : null;
      assets = assets.length > 1 ? assets.slice(1) : assets;
      const currency = (court.branch as any)?.tenantPreferences?.currency || 'USD';
      const mappedCourt = {
        ...court,
        assets,
        location: court.location
          ? {
            ...court.location,
            lng: court.location.coordinates.coordinates[0],
            lat: court.location.coordinates.coordinates[1],
          }
          : null,
        isBookmarked: options.include.bookmarks
          ? bookmarks?.has(court.id)
          : false,
        currency,
        ...data,
      };
      if (options.include.branch) {
        mappedCourt.branch = {
          ...court.branch,
          location: court.branch.location
            ? {
              ...court.branch.location,
              lng: court.branch.location.coordinates.coordinates[0],
              lat: court.branch.location.coordinates.coordinates[1],
            }
            : null,
        };
      }

      if (location && court.location?.coordinates) {
        mappedCourt.distance = this.locationsService.calculateDistance(
          {
            lat: location.latitude,
            lon: location.longitude,
          },
          {
            lat: court.location.coordinates.coordinates[1],
            lon: court.location.coordinates.coordinates[0],
          },
        );
      }

      if (mainAsset) {
        mappedCourt.mainAsset = mainAsset.url;
      }

      return mappedCourt;
    });
  }

  async findOne(
    id: string,
    relations: {
      location?: boolean;
      assets?: boolean;
      schedule?: boolean;
      branch?: boolean;
      availability?: boolean;
    } = {
        location: false,
        assets: false,
        branch: false,
        schedule: false,
        availability: false,
      },
    user?: SessionUser,
    location?: UserLocation,
  ) {
    const queryBuilder = this.courtRepository
      .createQueryBuilder('court')
      .where('court.id = :id', { id })
      .andWhere('court.deletedAt IS NULL');

    if (relations.branch) {
      queryBuilder
        .leftJoinAndSelect('court.branch', 'branch')
        .leftJoinAndSelect('branch.location', 'branchLocation')
        .leftJoinAndMapOne(
          'branch.tenantPreferences',
          'tenant_preferences',
          'tenantPreferences',
          'tenantPreferences.tenantId = branch.tenantId',
        )
        .addSelect([
          'branch.id',
          'branch.name',
          'branch.tenantId',
          'branchLocation.id',
          'branchLocation.name',
          'branchLocation.placeId',
          'branchLocation.address',
          'branchLocation.coordinates',
          'tenantPreferences.currency',
        ]);
    } else {
      queryBuilder
        .leftJoinAndSelect('court.branch', 'branch')
        .leftJoinAndMapOne(
          'branch.tenantPreferences',
          'tenant_preferences',
          'tenantPreferences',
          'tenantPreferences.tenantId = branch.tenantId',
        )
        .addSelect(['branch.id', 'branch.tenantId', 'tenantPreferences.currency']);
    }

    if (relations.schedule || relations.availability) {
      queryBuilder.leftJoinAndSelect('court.schedule', 'schedule');
      queryBuilder.leftJoinAndSelect(
        'schedule.availabilities',
        'availabilities',
      );
    }

    if (relations.location) {
      queryBuilder
        .leftJoinAndSelect('court.location', 'location')
        .addSelect([
          'location.id',
          'location.name',
          'location.placeId',
          'location.address',
          'location.coordinates',
        ]);
    }

    if (relations.assets) {
      queryBuilder
        .leftJoinAndMapMany(
          'court.assets',
          'assets',
          'assets',
          'assets.resourceId = court.id AND assets.type = :type',
          { type: AssetType.CourtImage },
        )
        .addSelect([
          'assets.id',
          'assets.mimeType',
          'assets.type',
          'assets.position',
        ]);
    }

    const court = await queryBuilder.getOne();
    if (!court) {
      return null;
    }

    const isBookmarked =
      user && user.type === UserType.Customer
        ? (
          await this.bookmarksService.getBookmarkedResources([id], user.id)
        ).has(id)
        : false;

    const assets = court.assets
      ?.sort((a, b) => a.position - b.position)
      ?.map((asset) => ({
        ...asset,
        url: this.assetsService.getUrl(asset.id),
      }));
    const mainAsset = assets?.length
      ? assets?.find((asset) => asset.type === AssetType.CourtImage)
      : null;

    const currency = (court.branch as any)?.tenantPreferences?.currency || 'USD';

    const mappedCourt: Court = {
      ...court,
      isBookmarked,
      assets,
      branch: court.branch
        ? {
          ...court.branch,
          location: court.branch.location
            ? {
              ...court.branch.location,
              lng: court.branch.location.coordinates.coordinates[0],
              lat: court.branch.location.coordinates.coordinates[1],
            }
            : null,
        }
        : undefined,
      location: court.location
        ? {
          ...court.location,
          lng: court.location.coordinates.coordinates[0],
          lat: court.location.coordinates.coordinates[1],
        }
        : null,
      currency,
    };

    if (relations.availability) {
      const availability = await this.getDaysAvailability(
        court.schedule,
        dayjs().format('YYYY-MM'),
        30,
      );
      mappedCourt.unavailableDays = availability.unavailableDays;
    }

    if (location && court.location?.coordinates) {
      mappedCourt.distance = this.locationsService.calculateDistance(
        {
          lat: location.latitude,
          lon: location.longitude,
        },
        {
          lat: court.location.coordinates.coordinates[1],
          lon: court.location.coordinates.coordinates[0],
        },
      );
    }

    if (mainAsset) {
      mappedCourt.mainAsset = mainAsset.url;
    }

    return mappedCourt;
  }

  async findByIds(ids: string[], select?: FindOptionsSelect<Court>) {
    return this.courtRepository.find({
      where: { id: In(ids), deletedAt: IsNull() },
      select,
    });
  }

  @Transactional()
  async update(
    id: string,
    {
      images,
      videoAssetId,
      placeId,
      schedule: scheduleData,
      ...data
    }: UpdateCourtDto,
    currentUser: SessionUser,
  ) {
    const court = await this.findOne(
      id,
      {
        branch: true,
        schedule: true,
        assets: true,
      },
      currentUser,
    );
    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    if (court.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(NOT_ALLOWED);
    }

    const location = placeId
      ? await this.locationsService.addLocation(placeId)
      : null;

    const updateData: Partial<Court> = {
      ...data,
    };

    if (location) {
      updateData.locationId = location.id;
    }

    if (videoAssetId) {
      await this.assetsService.assignAssets(
        videoAssetId,
        court.id,
        AssetType.CourtVideo,
      );
    }

    if (images?.length) {
      await this.assetsService.assignAssets(
        images,
        court.id,
        AssetType.CourtImage,
      );
    } else if (images?.length === 0) {
      await this.assetsService.unassignAssets(
        court.assets.map((asset) => asset.id),
      );
    }

    if (scheduleData && court.schedule) {
      await this.schedulesService.update(court.schedule.id, scheduleData);
    } else if (scheduleData) {
      await this.schedulesService.create(scheduleData, court.id, false);
    }

    if (Object.keys(updateData).length > 0) {
      await this.courtRepository.update(id, updateData);
    }

    const updatedCourt = await this.findOne(
      id,
      {
        branch: true,
        schedule: true,
        assets: true,
        location: true,
      },
      currentUser,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(CourtEvent.COURT_UPDATED, {
        court: updatedCourt,
      } satisfies CourtEventPayload);
    });

    return updatedCourt;
  }

  @Transactional()
  async updateRating(courtId: string, rating: number, inc: boolean) {
    const court = await this.courtRepository.findOne({
      where: { id: courtId },
      select: ['ratingStats'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    const { ratingStats } = court;

    let totalCount = 0;
    let totalRating = 0;

    ratingStats[rating] = Math.max(0, (ratingStats[rating] || 0) + (inc ? 1 : -1));

    Object.entries(ratingStats).forEach(([rating, count]) => {
      totalCount += count;
      totalRating += count * Number(rating);
    });

    const newAvgRating = totalCount > 0 ? totalRating / totalCount : 0;
    const increment = inc ? 1 : -1;

    await this.courtRepository
      .createQueryBuilder()
      .update(Court)
      .set({
        avgRating: newAvgRating,
        reviewsCount: () => `GREATEST(0, "reviewsCount" + :increment)`,
        ratingStats: () => `:ratingStats::jsonb`,
      })
      .where('id = :courtId', { courtId })
      .setParameters({
        increment,
        ratingStats: JSON.stringify(ratingStats),
      })
      .execute();
  }

  @Transactional()
  async delete(id: string, currentUser: SessionUser) {
    const court = await this.findOne(id, { branch: true }, currentUser);
    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }
    if (court.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(NOT_ALLOWED);
    }
    await this.courtRepository.softDelete(id);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(CourtEvent.COURT_DELETED, {
        court,
      });
    });
  }
  @Transactional()
  async deleteBranchCourts(branchId: string) {
    await this.courtRepository.softDelete({ branchId });
  }

  async getAvailability(
    id: string,
    { date, duration }: { date: string; duration: number },
    user: SessionUser,
  ) {
    const court = await this.findOne(
      id,
      {
        schedule: true,
      },
      user,
    );

    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    if (!court.schedule) {
      return [];
    }

    const startOfDay = dayjs
      .tz(date, court.schedule.timeZone)
      .startOf('day')
      .toDate();

    const endOfDay = dayjs
      .tz(date, court.schedule.timeZone)
      .endOf('day')
      .toDate();

    const [bookings, reservedSlots] = await Promise.all([
      this.slotsService.findBookingsInRange(id, startOfDay, endOfDay),
      this.slotsService.getTemporarilyReservedSlots(id, startOfDay, endOfDay),
    ]);

    return court.schedule.getSlots(
      bookings,
      reservedSlots,
      {
        from: startOfDay,
        to: endOfDay,
        duration,
      },
    );
  }

  async getDaysAvailability(schedule: Schedule, month: string, duration: number) {
    const from = dayjs(month).startOf('month').toDate();
    const to = dayjs(month).endOf('month').toDate();

    const [bookings, reservedSlots] = await Promise.all([
      this.slotsService.findBookingsInRange(schedule.courtId, from, to),
      this.slotsService.getTemporarilyReservedSlots(schedule.courtId, from, to),
    ]);

    return schedule.getDaysAvailability(
      bookings,
      reservedSlots,
      {
        from,
        to,
        duration,
      },
    );
  }

  async exists(id: string) {
    return this.courtRepository.exists({ where: { id, deletedAt: IsNull() } });
  }

  async findCourtIdsByBranch(branchId: string): Promise<string[]> {
    const courts = await this.courtRepository.find({
      where: {
        branchId,
        deletedAt: IsNull(),
      },
      select: ['id'],
    });
    return courts.map((court) => court.id);
  }

  async increment(id: string, field: keyof Court, value: number) {
    return this.courtRepository.increment({ id }, field, value);
  }

  async decrement(id: string, field: keyof Court, value: number) {
    return this.courtRepository.decrement({ id }, field, value);
  }

  @OnEvent(CourtEvent.COURT_CREATED)
  private handleCourtCreated(payload: CourtEventPayload) {
    this.logger.log('Court created', payload);
  }

  @OnEvent(CourtEvent.COURT_UPDATED)
  private handleCourtUpdated(payload: CourtEventPayload) {
    this.logger.log('Court updated', payload);
  }

  @OnEvent(CourtEvent.COURT_DELETED)
  private handleCourtDeleted({ court }: CourtEventPayload) {
    this.logger.log('Court deleted', court);
  }
}
