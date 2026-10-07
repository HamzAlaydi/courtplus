import {
  BadRequestException,
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
import { Court, CourtStatus } from './entities/court.entity';
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
  COURT_CREATION_NOT_ALLOWED,
  COURT_NOT_FOUND,
  COURT_HAS_UPCOMING_BOOKINGS,
  BRANCH_NOT_FOUND,
  INVALID_COURT_STATUS_TRANSITION,
} from '../shared/error-codes';
import { LocationsService } from 'src/modules/branches/locations.service';
import { UserLocation } from 'src/decorators/location.decorator';
import { SchedulesService } from '../schedules/schedules.service';
import { UserType } from '../auth/@types/user.type';
import { SortDirection } from 'src/common/sort';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SlotsService } from '../bookings/slots.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { BranchStatus } from '../branches/entities/branch.entity';
import { dayjs } from 'src/modules/shared/dayjs';
import { CourtEvent } from './courts.events';
import { CourtEventPayload } from './courts.events';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { Schedule } from '../schedules/entities/schedule.entity';
/**
 * Columns a customer may see on a court. Everything omitted here is either
 * the vendor's business data or ops moderation state.
 */
const CUSTOMER_COURT_COLUMNS = [
  'court.id',
  'court.name',
  'court.description',
  'court.branchId',
  'court.length',
  'court.width',
  'court.size',
  'court.surface',
  'court.status',
  'court.avgRating',
  'court.reviewsCount',
  'court.ratingStats',
  'court.locationId',
  'court.hourlyRate',
  'court.sport',
  'court.isAirConditioned',
  'court.isWomenOnly',
  'court.minDuration',
  'court.bookmarksCount',
  'court.postsCount',
  // Shown to customers as the court's "sessions" count on the details
  // screen. Omitting it rendered a literal "undefined sessions".
  'court.totalBookings',
  'court.createdAt',
  'court.updatedAt',
];

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
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) { }

  @Transactional()
  async create(
    {
      images,
      videoAssetId,
      placeId,
      placeName,
      address,
      coordinates,
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

    // Lapsed subscription: no new units. A tenant with no subscription yet is
    // allowed through — the court waits in pending_payment and is billed by
    // the first Checkout. There was no server-side check at all here before.
    const availability = await this.subscriptionsService.getCourtAvailability(
      currentUser.tenantId,
    );
    if (!availability.canCreate) {
      throw new ForbiddenException(COURT_CREATION_NOT_ALLOWED);
    }

    const location = coordinates
      ? await this.locationsService.addLocationWithCoordinates({
          coordinates,
          name: placeName || address || data.name,
          address: address || placeName || '',
        })
      : placeId
        ? await this.locationsService.addLocation(placeId)
        : null;

    const court = await this.courtRepository.save({
      ...data,
      status: CourtStatus.PENDING_PAYMENT,
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
      isAirConditioned,
      isWomenOnly,
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
    // Staff see their own operational columns; customers must not.
    const isStaffViewer = user?.type === UserType.Staff;

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
        // 'court' would ship every column. Customers were receiving the
        // vendor's revenue and minutes booked, plus internal moderation
        // fields (rejectionReason, reviewedByStaffId, submittedAt,
        // reviewedAt). Staff still get the full row below.
        ...(isStaffViewer ? ['court'] : CUSTOMER_COURT_COLUMNS),
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
    queryBuilder.leftJoin('branch.tenant', 'tenant');

    if (user.type === UserType.Staff) {
      queryBuilder.andWhere('branch.tenantId = :tenantId', {
        tenantId: user.tenantId,
      });
    } else {
      // Customer-facing visibility: only available courts from
      // non-suspended branches and non-blocked tenants are returned.
      queryBuilder.andWhere('court.status = :visibleStatus', {
        visibleStatus: CourtStatus.AVAILABLE,
      });
      queryBuilder.andWhere('branch.suspendedAt IS NULL');
      queryBuilder.andWhere('tenant.blockedAt IS NULL');
      // A venue whose subscription lapsed stops appearing and stops taking
      // NEW bookings; what customers already paid for is untouched.
      queryBuilder.andWhere('tenant."subscriptionLapsedAt" IS NULL');
      // The vendor's "show to users" switch and a closed / under-maintenance
      // branch were ignored: hidden branches stayed listed and bookable.
      queryBuilder.andWhere('branch.isVisible IS DISTINCT FROM false');
      queryBuilder.andWhere('branch.status NOT IN (:...hiddenBranchStatuses)', {
        // "occupied" means every court is busy right now, not that the venue is
        // shut: requiring status = 'open' hid a working branch and all of its
        // courts from customers. Only closed and under-maintenance hide.
        hiddenBranchStatuses: [
          BranchStatus.CLOSED,
          BranchStatus.UNDER_MAINTENANCE,
        ],
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
          COALESCE(location.coordinates, branchLocation.coordinates)::geography,
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

    // The app sends true or omits these params, so false means "no filter".
    if (isAirConditioned === true) {
      queryBuilder.andWhere('court.isAirConditioned = true');
    }
    if (isWomenOnly === true) {
      queryBuilder.andWhere('court.isWomenOnly = true');
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
    } else {
      queryBuilder.orderBy('court.createdAt', SortDirection.DESC);
    }
    // Deterministic pages: without a tiebreaker rows could repeat or skip
    // between pages of an infinite scroll.
    queryBuilder.addOrderBy('court.id', 'ASC');

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
      // The enum value is lowercase; the literal 'CANCELLED' made Postgres
      // reject the query, so the availability filter returned 500 every time.
      queryBuilder.setParameter('cancelledStatus', BookingStatus.CANCELLED);
      queryBuilder.setParameter('startDate', startDate);
      queryBuilder.setParameter('endDate', endDate);
    }

    const [courts, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

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
      const currency = (court.branch as any)?.tenantPreferences?.currency || 'SAR';
      const mappedCourt = {
        ...court,
        assets,
        // Fall back to the branch's location. A court's own `locationId` is
        // optional and the dashboard does not require one, so most courts have
        // none — and every client that showed `court.location.name` crashed on
        // null, which made those courts unbookable from the mobile app.
        location: (() => {
          const source = court.location ?? court.branch?.location ?? null;
          return source
            ? {
              ...source,
              lng: source.coordinates.coordinates[0],
              lat: source.coordinates.coordinates[1],
            }
            : null;
        })(),
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

      const courtCoords =
        court.location?.coordinates ?? court.branch?.location?.coordinates;
      if (location && courtCoords) {
        mappedCourt.distance = this.locationsService.calculateDistance(
          {
            lat: location.latitude,
            lon: location.longitude,
          },
          {
            lat: courtCoords.coordinates[1],
            lon: courtCoords.coordinates[0],
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

    // Same column restriction as the list query. It was applied there only, so
    // opening a single court still handed the customer the vendor's revenue
    // and the ops moderation trail.
    if (user && user.type !== UserType.Staff) {
      queryBuilder.select(CUSTOMER_COURT_COLUMNS);
    }

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
          'assets.resourceId = court.id AND assets.type IN (:...assetTypes)',
          { assetTypes: [AssetType.CourtImage, AssetType.CourtVideo] },
        )
        .addSelect([
          'assets.id',
          'assets.mimeType',
          'assets.type',
          'assets.position',
        ]);
    }

    if (user && user.type !== UserType.Staff) {
      // Customer-facing visibility: non-available courts and courts of
      // suspended branches / blocked tenants are hidden (404).
      queryBuilder.leftJoin('branch.tenant', 'tenant');
      queryBuilder.andWhere('court.status = :visibleStatus', {
        visibleStatus: CourtStatus.AVAILABLE,
      });
      queryBuilder.andWhere('branch.suspendedAt IS NULL');
      queryBuilder.andWhere('tenant.blockedAt IS NULL');
      // A venue whose subscription lapsed stops appearing and stops taking
      // NEW bookings; what customers already paid for is untouched.
      queryBuilder.andWhere('tenant."subscriptionLapsedAt" IS NULL');
      // The list query hides branches the vendor switched off or closed, but
      // this one did not, so a customer holding a court id from an earlier
      // listing could still open and book a court at a closed or hidden
      // branch. Booking goes through findOne, so this was the live hole.
      queryBuilder.andWhere('branch.isVisible IS DISTINCT FROM false');
      queryBuilder.andWhere('branch.status NOT IN (:...hiddenBranchStatuses)', {
        // "occupied" means every court is busy right now, not that the venue is
        // shut: requiring status = 'open' hid a working branch and all of its
        // courts from customers. Only closed and under-maintenance hide.
        hiddenBranchStatuses: [
          BranchStatus.CLOSED,
          BranchStatus.UNDER_MAINTENANCE,
        ],
      });
    }

    if (user && user.type === UserType.Staff) {
      // Staff visibility: courts are scoped to the staff member's tenant.
      queryBuilder.andWhere('branch.tenantId = :tenantId', {
        tenantId: user.tenantId,
      });
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

    const currency = (court.branch as any)?.tenantPreferences?.currency || 'SAR';

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
      // Same branch fallback as the list mapping: a court's own locationId is
      // optional, and clients that read `court.location.name` crashed on null.
      location: (() => {
        const source = court.location ?? court.branch?.location ?? null;
        return source
          ? {
            ...source,
            lng: source.coordinates.coordinates[0],
            lat: source.coordinates.coordinates[1],
          }
          : null;
      })(),
      currency,
    };

    if (relations.availability && court.schedule) {
      const availability = await this.getDaysAvailability(
        court.schedule,
        dayjs().format('YYYY-MM'),
        30,
      );
      mappedCourt.unavailableDays = availability.unavailableDays;
    }

    const courtCoords =
      court.location?.coordinates ?? court.branch?.location?.coordinates;
    if (location && courtCoords) {
      mappedCourt.distance = this.locationsService.calculateDistance(
        {
          lat: location.latitude,
          lon: location.longitude,
        },
        {
          lat: courtCoords.coordinates[1],
          lon: courtCoords.coordinates[0],
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
      placeName,
      address,
      coordinates,
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

    const location = coordinates
      ? await this.locationsService.addLocationWithCoordinates({
          coordinates,
          name: placeName || address || data.name || court.name,
          address: address || placeName || '',
        })
      : placeId
        ? await this.locationsService.addLocation(placeId)
        : null;

    const updateData: Partial<Court> = {
      ...data,
    };

    // Moving a court to another branch must stay inside the tenant: the
    // branch id came straight from the body and was written unchecked.
    if (updateData.branchId && updateData.branchId !== court.branchId) {
      const target = await this.branchesService.findOne(
        updateData.branchId,
        currentUser,
      );
      if (!target || target.tenantId !== currentUser.tenantId) {
        throw new NotFoundException(BRANCH_NOT_FOUND);
      }
    }

    // Moderation states (pending_payment/pending_approval/changes_requested/
    // suspended) are owned by the ops/billing flows — a vendor edit must never
    // stomp them with a plain available/unavailable toggle, nor may a vendor
    // write a moderation state themselves.
    if (
      court.status !== CourtStatus.AVAILABLE &&
      court.status !== CourtStatus.UNAVAILABLE
    ) {
      delete updateData.status;
    } else if (
      updateData.status &&
      ![CourtStatus.AVAILABLE, CourtStatus.UNAVAILABLE].includes(updateData.status)
    ) {
      throw new BadRequestException(INVALID_COURT_STATUS_TRANSITION);
    }

    if (location) {
      updateData.locationId = location.id;
    }

    if (videoAssetId) {
      await this.assetsService.assignAssets(
        videoAssetId,
        court.id,
        AssetType.CourtVideo,
      );
    } else if (videoAssetId === null) {
      // Explicit removal from the edit form never persisted before.
      await this.assetsService.unassignAssetsByResource(
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
      // Only the photos: this used to unassign every asset, video included.
      await this.assetsService.unassignAssetsByResource(
        court.id,
        AssetType.CourtImage,
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
    // Paid, upcoming bookings would be orphaned (no refund, no notice, and
    // the customer's booking screen breaks). Make the vendor cancel them first.
    if (await this.countUpcomingBookings([id])) {
      throw new BadRequestException(COURT_HAS_UPCOMING_BOOKINGS);
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

  async findIdsByBranch(branchId: string): Promise<string[]> {
    const courts = await this.courtRepository.find({
      where: { branchId },
      select: { id: true },
    });
    return courts.map((c) => c.id);
  }

  /** Bookings still to be played (or in play) on any of these courts. */
  async countUpcomingBookings(courtIds: string[]): Promise<number> {
    if (!courtIds.length) return 0;
    return this.courtRepository.manager
      .createQueryBuilder(Booking, 'b')
      .where('b."courtId" IN (:...courtIds)', { courtIds })
      .andWhere('b.status IN (:...live)', {
        live: [BookingStatus.PENDING, BookingStatus.IN_PROGRESS],
      })
      .andWhere('b."endDate" > NOW()')
      .getCount();
  }

  private assertCourtStatus(court: Court, allowed: CourtStatus[]) {
    if (!allowed.includes(court.status)) {
      throw new BadRequestException(INVALID_COURT_STATUS_TRANSITION);
    }
  }

  private async findForModeration(id: string): Promise<Court> {
    const court = await this.courtRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['branch'],
    });
    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }
    return court;
  }

  @Transactional()
  async approve(id: string, reviewer: SessionUser): Promise<Court> {
    const court = await this.findForModeration(id);
    this.assertCourtStatus(court, [CourtStatus.PENDING_APPROVAL]);
    await this.courtRepository.update(id, {
      status: CourtStatus.AVAILABLE,
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedByStaffId: reviewer.id,
    });
    return this.findForModeration(id);
  }

  @Transactional()
  async requestChanges(
    id: string,
    reason: string,
    reviewer: SessionUser,
  ): Promise<Court> {
    const court = await this.findForModeration(id);
    this.assertCourtStatus(court, [CourtStatus.PENDING_APPROVAL]);
    await this.courtRepository.update(id, {
      status: CourtStatus.CHANGES_REQUESTED,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedByStaffId: reviewer.id,
    });
    return this.findForModeration(id);
  }

  @Transactional()
  async suspend(id: string, reason: string, reviewer: SessionUser): Promise<Court> {
    const court = await this.findForModeration(id);
    // Only a published court is suspended. A pending one that was suspended
    // and later unsuspended came back as AVAILABLE — published without any
    // review; for pending courts ops uses "request changes" instead.
    this.assertCourtStatus(court, [CourtStatus.AVAILABLE]);
    await this.courtRepository.update(id, {
      status: CourtStatus.SUSPENDED,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedByStaffId: reviewer.id,
    });
    return this.findForModeration(id);
  }

  @Transactional()
  async unsuspend(id: string, reviewer: SessionUser): Promise<Court> {
    const court = await this.findForModeration(id);
    this.assertCourtStatus(court, [CourtStatus.SUSPENDED]);
    await this.courtRepository.update(id, {
      status: CourtStatus.AVAILABLE,
      rejectionReason: null,
      reviewedAt: new Date(),
      reviewedByStaffId: reviewer.id,
    });
    return this.findForModeration(id);
  }

  @Transactional()
  async resubmit(id: string, currentUser: SessionUser): Promise<Court> {
    const court = await this.findForModeration(id);
    if (court.branch.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(NOT_ALLOWED);
    }
    this.assertCourtStatus(court, [CourtStatus.CHANGES_REQUESTED]);
    await this.courtRepository.update(id, {
      status: CourtStatus.PENDING_APPROVAL,
      submittedAt: new Date(),
    });
    const updatedCourt = await this.findForModeration(id);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(CourtEvent.COURT_RESUBMITTED, {
        court: updatedCourt,
      } satisfies CourtEventPayload);
    });

    return updatedCourt;
  }

  @Transactional()
  async markCourtsPendingApproval(ids: string[]): Promise<Court[]> {
    if (!ids.length) {
      return [];
    }
    await this.courtRepository.update(
      { id: In(ids), status: CourtStatus.PENDING_PAYMENT, deletedAt: IsNull() },
      {
        status: CourtStatus.PENDING_APPROVAL,
        submittedAt: new Date(),
      },
    );
    return this.courtRepository.find({
      where: { id: In(ids), status: CourtStatus.PENDING_APPROVAL },
      relations: ['branch'],
    });
  }

  async markTenantCourtsPendingApproval(tenantId: string): Promise<Court[]> {
    const pendingCourts = await this.courtRepository.find({
      where: {
        status: CourtStatus.PENDING_PAYMENT,
        deletedAt: IsNull(),
        branch: { tenantId },
      },
      relations: ['branch'],
      select: ['id'],
    });
    return this.markCourtsPendingApproval(pendingCourts.map((court) => court.id));
  }

  async findPendingPaymentByTenant(tenantId: string): Promise<Court[]> {
    return this.courtRepository.find({
      where: {
        status: CourtStatus.PENDING_PAYMENT,
        deletedAt: IsNull(),
        branch: { tenantId },
      },
      relations: ['branch'],
      order: { createdAt: 'ASC' },
    });
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.courtRepository.count({
      where: { deletedAt: IsNull(), branch: { tenantId } },
    });
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

    // Look for bookings a day further than the slots we generate. A venue
    // open 18:00-02:00 produces slots that run into the next morning, and
    // those bookings sit past endOfDay — so they were never loaded and the
    // post-midnight slots showed as free even when taken. The generation
    // window itself must stay one day, or the loop would emit a second day
    // of slots.
    const bookingLookupEnd = dayjs(endOfDay).add(1, 'day').toDate();

    const [bookings, reservedSlots] = await Promise.all([
      this.slotsService.findBookingsInRange(id, startOfDay, bookingLookupEnd),
      this.slotsService.getTemporarilyReservedSlots(
        id,
        startOfDay,
        bookingLookupEnd,
      ),
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
    // Build the range in the court's own timezone: on a UTC server the
    // first/last day of the month was re-interpreted in Asia/Riyadh and
    // came out duplicated or missing.
    const tz = schedule.timeZone || 'UTC';
    const from = dayjs.tz(month, 'YYYY-MM', tz).startOf('month').toDate();
    const to = dayjs.tz(month, 'YYYY-MM', tz).endOf('month').toDate();

    // Same reason as getAvailability: the last day of a cross-midnight month
    // spills into the first hours of the next one.
    const bookingLookupEnd = dayjs(to).add(1, 'day').toDate();

    const [bookings, reservedSlots] = await Promise.all([
      this.slotsService.findBookingsInRange(
        schedule.courtId,
        from,
        bookingLookupEnd,
      ),
      this.slotsService.getTemporarilyReservedSlots(
        schedule.courtId,
        from,
        bookingLookupEnd,
      ),
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

  /**
   * Floors at zero, exactly like BranchesService.decrement. A plain
   * `decrement` let a counter go negative whenever a booking was cancelled
   * that had never been counted in (anything created before this handler
   * worked), and the vendor then saw "-150 SAR" revenue with no way back.
   */
  async decrement(id: string, field: keyof Court, value: number) {
    return this.courtRepository
      .createQueryBuilder()
      .update(Court)
      .set({
        [field]: () => `GREATEST("${String(field)}" - ${Number(value)}, 0)`,
      })
      .where('id = :id', { id })
      .execute();
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
