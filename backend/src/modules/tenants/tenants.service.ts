import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { Tenant, type TenantCount } from './entities/tenant.entity';
import { ListTenantsDto, ListTenantsResponseDto } from '../admin/dto/admin-tenants.dto';
import { TenantPreferences } from './entities/tenant-preferences.entity';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantPreferencesDto } from './dto/update-tenant-preferences.dto';
import { AssetsService } from 'src/modules/assets/assets.service';
import { Asset, AssetType } from 'src/modules/assets/entities/asset.entity';
import { TENANT_NOT_FOUND } from '../shared/error-codes';
import { OnEvent } from '@nestjs/event-emitter';
import { BranchEvent } from '../branches/branch.events';
import { CourtEvent } from '../courts/courts.events';
import { StaffEvent } from '../staff/staff.events';
import { BookingEventType } from '../bookings/entities/event.entity';
import { ReviewEvent, type ReviewEventPayload } from '../reviews/reviews.events';
import { SessionUser } from '../auth/@types/session';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BranchAvailabilityResponseDto } from '../subscriptions/dto/branch-availability.dto';
@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantPreferences)
    private readonly tenantPreferencesRepository: Repository<TenantPreferences>,
    private readonly assetsService: AssetsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly subscriptionsService: SubscriptionsService,
  ) { }



  async create(data: Partial<Tenant>): Promise<Tenant> {
    return this.tenantRepository.save(data);
  }

  async getBranchCreationAvailability(tenantId: string): Promise<BranchAvailabilityResponseDto> {
    return this.subscriptionsService.checkCanCreateBranch(tenantId);
  }



  async blockTenant(tenantId: string, blocked: boolean): Promise<void> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(TENANT_NOT_FOUND);
    }

    await this.tenantRepository.update(tenantId, {
      blockedAt: blocked ? new Date() : null,
    });
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

    tenant.logoURL = tenant.logoAsset?.url;

    return tenant;
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
      preferences.currency = 'USD';
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

  @OnEvent(BookingEventType.PAYMENT_COMPLETED)
  private async handleBookingPaymentCompleted({ booking }: any) {
    if (booking.court.branch) {
      await this.incrementCount(
        booking.court.branch.tenantId,
        booking.totalAmount,
        'totalRevenue',
      );
    }
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
