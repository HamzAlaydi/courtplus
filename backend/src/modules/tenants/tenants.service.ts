import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { Tenant, type TenantCount } from './entities/tenant.entity';
import { UnsuspendRequest } from './entities/unsuspend-request.entity';
import { ListTenantsDto, ListTenantsResponseDto } from '../admin/dto/admin-tenants.dto';
import { TenantPreferences } from './entities/tenant-preferences.entity';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantPreferencesDto } from './dto/update-tenant-preferences.dto';
import { AssetsService } from 'src/modules/assets/assets.service';
import { Asset, AssetType } from 'src/modules/assets/entities/asset.entity';
import { TENANT_NOT_FOUND, TENANT_ALREADY_BLOCKED, TENANT_NOT_BLOCKED, UNSUSPEND_REQUEST_ALREADY_EXISTS } from '../shared/error-codes';
import { OnEvent } from '@nestjs/event-emitter';
import { BranchEvent } from '../branches/branch.events';
import { CourtEvent } from '../courts/courts.events';
import { StaffEvent } from '../staff/staff.events';
import { BookingEventType } from '../bookings/entities/event.entity';
import type {
  BookingPaymentCapturedEventPayload,
  BookingPaymentRefundedEventPayload,
} from '../bookings/bookings.events';
import { Booking } from '../bookings/entities/booking.entity';
import { BranchesService } from '../branches/branches.service';
import { ReviewEvent, type ReviewEventPayload } from '../reviews/reviews.events';
import { SessionUser } from '../auth/@types/session';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BranchAvailabilityResponseDto } from '../subscriptions/dto/branch-availability.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantPreferences)
    private readonly tenantPreferencesRepository: Repository<TenantPreferences>,
    @InjectRepository(UnsuspendRequest)
    private readonly unsuspendRequestRepository: Repository<UnsuspendRequest>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly assetsService: AssetsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
  ) { }



  async create(data: Partial<Tenant>): Promise<Tenant> {
    return this.tenantRepository.save(data);
  }

  async getBranchCreationAvailability(tenantId: string): Promise<BranchAvailabilityResponseDto> {
    return this.subscriptionsService.checkCanCreateBranch(tenantId);
  }



  async blockTenant(
    tenantId: string,
    blocked: boolean,
    reason?: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(TENANT_NOT_FOUND);
    }

    if (blocked && tenant.blockedAt) {
      throw new BadRequestException(TENANT_ALREADY_BLOCKED);
    }
    if (!blocked && !tenant.blockedAt) {
      throw new BadRequestException(TENANT_NOT_BLOCKED);
    }

    await this.tenantRepository.update(tenantId, {
      blockedAt: blocked ? new Date() : null,
      blockedReason: blocked ? reason : null,
    });

    if (!blocked) {
      await this.unsuspendRequestRepository.update(
        { tenantId, resolvedAt: IsNull() },
        { resolvedAt: new Date() },
      );
    }
  }

  async requestUnsuspend(
    tenantId: string,
    message: string,
  ): Promise<UnsuspendRequest> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(TENANT_NOT_FOUND);
    }

    if (!tenant.blockedAt) {
      throw new BadRequestException(TENANT_NOT_BLOCKED);
    }

    const existingRequest = await this.unsuspendRequestRepository.findOne({
      where: { tenantId, resolvedAt: IsNull() },
    });
    if (existingRequest) {
      throw new BadRequestException(UNSUSPEND_REQUEST_ALREADY_EXISTS);
    }

    const request = await this.unsuspendRequestRepository.save({
      tenantId,
      message,
    });

    await this.notificationsService.notifyOps({
      type: NotificationType.TENANT_UNSUSPEND_REQUESTED,
      data: {
        kind: NotificationType.TENANT_UNSUSPEND_REQUESTED,
        tenantId,
        tenantName: tenant.name,
        message,
      },
      resourceId: request.id,
    });

    return request;
  }

  async listTenants({
    page = 1,
    pageSize = 10,
    search,
    blocked,
  }: ListTenantsDto): Promise<ListTenantsResponseDto> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (blocked === true) {
      where.blockedAt = Not(IsNull());
    } else if (blocked === false) {
      where.blockedAt = IsNull();
    }

    const [tenants, total] = await this.tenantRepository.findAndCount({
      where,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        totalBranches: true,
        totalCourts: true,
        totalStaff: true,
        createdAt: true,
        totalBookings: true,
        totalReviews: true,
        totalRevenue: true,
        blockedAt: true
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      items: tenants,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndMapOne(
        'tenant.logoAsset',
        Asset,
        'logoAsset',
        'logoAsset.resourceId = tenant.id AND logoAsset.type = :type',
        { type: AssetType.TenantLogo },
      )
      .where('tenant.id = :tenantId', { tenantId })
      .getOne();

    if (!tenant) {
      throw new NotFoundException(TENANT_NOT_FOUND);
    }

    tenant.logoURL = tenant.logoAsset
      ? this.assetsService.getUrl(tenant.logoAsset.id)
      : undefined;

    return tenant;
  }

  /**
   * Persist the Stripe customer id on the tenant, but only when it is not
   * set yet (atomic, idempotent backfill for webhook-created subscriptions).
   */
  async setProviderCustomerIdIfMissing(
    tenantId: string,
    providerCustomerId: string,
  ): Promise<void> {
    if (!providerCustomerId) {
      return;
    }
    await this.tenantRepository.update(
      { id: tenantId, providerCustomerId: IsNull() },
      { providerCustomerId },
    );
  }

  async updateTenant(
    userId: string,
    { logoAssetId, name, phoneNumber, documents }: UpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.getTenant(userId);

    if (logoAssetId) {
      await this.assetsService.assignAssets(
        logoAssetId,
        tenant.id,
        AssetType.TenantLogo,
      );
      tenant.profileCompletion.logo = true;
    }

    tenant.profileCompletion.name = !!name;
    tenant.profileCompletion.phoneNumber = !!phoneNumber;
    const updatedTenant = await this.tenantRepository.save({
      ...tenant,
      name,
      phoneNumber,
    });

    return updatedTenant;
  }

  async incrementCount(tenantId: string, count: number, field: TenantCount) {
    return this.tenantRepository.update(tenantId, {
      [field]: () => `GREATEST(COALESCE("${field}", 0) + ${count}, 0)`,
    });
  }

  async getPreferences(tenantId: string): Promise<TenantPreferences> {
    const cacheKey = this.getPreferencesCacheKey(tenantId);
    const cached = await this.cacheManager.get<TenantPreferences>(cacheKey);
    if (cached) {
      return cached;
    }

    let preferences = await this.tenantPreferencesRepository.findOne({
      where: { tenantId },
    });

    if (!preferences) {
      preferences = new TenantPreferences();
      preferences.tenantId = tenantId;
      preferences.currency = 'SAR';
    }

    await this.cacheManager.set(cacheKey, preferences, 300000);
    return preferences;
  }

  async updatePreferences(
    user: SessionUser,
    dto: UpdateTenantPreferencesDto,
  ): Promise<TenantPreferences> {
    const tenantId = user.tenantId;

    await this.tenantPreferencesRepository.upsert({ tenantId, currency: dto.currency }, { conflictPaths: ['tenantId'] });
    await this.cacheManager.del(this.getPreferencesCacheKey(tenantId));
    return this.getPreferences(tenantId);
  }

  private getPreferencesCacheKey(tenantId: string): string {
    return `tenant_preferences#${tenantId}`;
  }

  @OnEvent(BranchEvent.BRANCH_CREATED)
  private async handleBranchCreated({ branch }: any) {
    await this.incrementCount(branch.tenantId, 1, 'totalBranches');
  }

  @OnEvent(BranchEvent.BRANCH_DELETED)
  private async handleBranchDeleted({ branch }: any) {
    await this.incrementCount(branch.tenantId, -1, 'totalBranches');
  }

  @OnEvent(CourtEvent.COURT_CREATED)
  private async handleCourtCreated({ court, branch }: any) {
    await this.incrementCount(branch.tenantId, 1, 'totalCourts');
  }

  @OnEvent(CourtEvent.COURT_DELETED)
  private async handleCourtDeleted({ court }: any) {
    await this.incrementCount(court.branch.tenantId, -1, 'totalCourts');
  }

  @OnEvent(StaffEvent.STAFF_CREATED)
  private async handleStaffCreated({ staff }: any) {
    await this.incrementCount(staff.tenantId, 1, 'totalStaff');
  }

  @OnEvent(StaffEvent.STAFF_DELETED)
  private async handleStaffDeleted({ staff }: any) {
    await this.incrementCount(staff.tenantId, -1, 'totalStaff');
  }

  @OnEvent(BookingEventType.CREATED)
  private async handleBookingCreated({ booking }: any) {
    if (booking.court.branch) {
      await this.incrementCount(
        booking.court.branch.tenantId,
        1,
        'totalBookings',
      );
    }
  }

  @OnEvent(BookingEventType.CANCELLED)
  private async handleBookingCancelled({ booking }: any) {
    if (booking.court.branch) {
      await this.incrementCount(
        booking.court.branch.tenantId,
        -1,
        'totalBookings',
      );
    }
  }

  @OnEvent(BookingEventType.PAYMENT_CAPTURED)
  private async handleBookingPaymentCaptured({
    booking,
    amount,
  }: BookingPaymentCapturedEventPayload) {
    const capturedAmount = Number(amount);
    if (
      !booking?.courtId ||
      !Number.isFinite(capturedAmount) ||
      capturedAmount <= 0
    ) {
      return;
    }

    const tenantId = await this.branchesService.getTenantIdFromCourtId(
      booking.courtId,
    );
    if (!tenantId) return;

    await this.incrementCount(tenantId, capturedAmount, 'totalRevenue');
  }

  @OnEvent(BookingEventType.PAYMENT_REFUNDED)
  private async handleBookingPaymentRefunded({
    bookingId,
    amount,
  }: BookingPaymentRefundedEventPayload) {
    const refundedAmount = Number(amount);
    if (!bookingId || !Number.isFinite(refundedAmount) || refundedAmount <= 0) {
      return;
    }

    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
      select: ['id', 'courtId'],
    });
    if (!booking) return;

    const tenantId = await this.branchesService.getTenantIdFromCourtId(
      booking.courtId,
    );
    if (!tenantId) return;

    await this.incrementCount(tenantId, -refundedAmount, 'totalRevenue');
  }

  @OnEvent(ReviewEvent.REVIEW_CREATED)
  private async handleReviewCreated({ review, booking }: ReviewEventPayload) {
    if (booking && booking.court.branch) {
      await this.incrementCount(
        booking.court.branch.tenantId,
        1,
        'totalReviews',
      );
    }
  }

  @OnEvent(ReviewEvent.REVIEW_DELETED)
  private async handleReviewDeleted({ review, booking }: ReviewEventPayload) {
    if (booking && booking.court.branch) {
      await this.incrementCount(
        booking.court.branch.tenantId,
        -1,
        'totalReviews',
      );
    }
  }
}
