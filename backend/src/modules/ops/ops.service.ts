import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { Court, CourtStatus } from '../courts/entities/court.entity';
import { CourtsService } from '../courts/courts.service';
import { CourtEvent, CourtEventPayload } from '../courts/courts.events';
import { BranchesService } from '../branches/branches.service';
import { TenantsService } from '../tenants/tenants.service';
import { StaffService } from '../staff/staff.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { LogsService } from '../logging/logging.service';
import { AssetsService } from '../assets/assets.service';
import { AssetType } from '../assets/entities/asset.entity';
import {
  UnsuspendRequest,
  UnsuspendRequestOutcome,
} from '../tenants/entities/unsuspend-request.entity';
import { UNSUSPEND_REQUEST_NOT_FOUND,
  CANNOT_DEACTIVATE_SELF,
} from '../shared/error-codes';
import type { SessionUser } from '../auth/@types/session';
import { ListPendingCourtsDto } from './dto/list-pending-courts.dto';
import { ListOpsLogsDto } from './dto/list-ops-logs.dto';
import { CreateOpsAdminDto } from './dto/ops-admin.dto';
import { StaffRole } from '../staff/entities/enum';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    @InjectRepository(Court)
    private readonly courtRepository: Repository<Court>,
    @InjectRepository(UnsuspendRequest)
    private readonly unsuspendRequestRepository: Repository<UnsuspendRequest>,
    private readonly courtsService: CourtsService,
    private readonly branchesService: BranchesService,
    private readonly tenantsService: TenantsService,
    private readonly staffService: StaffService,
    private readonly notificationsService: NotificationsService,
    private readonly logsService: LogsService,
    private readonly assetsService: AssetsService,
  ) { }

  async listPendingCourts({
    page = 1,
    pageSize = 10,
    status = CourtStatus.PENDING_APPROVAL,
  }: ListPendingCourtsDto) {
    const queryBuilder = this.courtRepository
      .createQueryBuilder('court')
      .leftJoinAndSelect('court.branch', 'branch')
      .leftJoinAndSelect('branch.tenant', 'tenant')
      .leftJoinAndSelect('court.location', 'location')
      .leftJoinAndMapMany(
        'court.assets',
        'assets',
        'assets',
        'assets.resourceId = court.id AND assets.type IN (:...assetTypes)',
        { assetTypes: [AssetType.CourtImage, AssetType.CourtVideo] },
      )
      .where('court.deletedAt IS NULL')
      .andWhere('court.status = :status', { status })
      .orderBy('court.submittedAt', 'ASC', 'NULLS LAST')
      .addOrderBy('court.createdAt', 'ASC');

    const [courts, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const items = courts.map((court) => ({
      ...court,
      assets: (court.assets ?? [])
        .sort((a, b) => a.position - b.position)
        .map((asset) => ({
          ...asset,
          url: asset.url ?? this.assetsService.getUrl(asset.id),
        })),
    }));

    return {
      items,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async approveCourt(id: string, reviewer: SessionUser) {
    const court = await this.courtsService.approve(id, reviewer);

    await this.notificationsService.notifyStaff(
      { tenantId: court.branch.tenantId },
      {
        email: true,
        type: NotificationType.COURT_APPROVED,
        data: {
          kind: NotificationType.COURT_APPROVED,
          courtId: court.id,
          branchId: court.branchId,
          courtName: court.name,
          branchName: court.branch?.name,
        },
        emailData: {
          courtName: court.name,
          branchName: court.branch?.name,
        },
        resourceId: court.id,
      },
    );

    return court;
  }

  async requestCourtChanges(id: string, reason: string, reviewer: SessionUser) {
    const court = await this.courtsService.requestChanges(id, reason, reviewer);

    await this.notificationsService.notifyStaff(
      { tenantId: court.branch.tenantId },
      {
        email: true,
        type: NotificationType.COURT_CHANGES_REQUESTED,
        data: {
          kind: NotificationType.COURT_CHANGES_REQUESTED,
          courtId: court.id,
          branchId: court.branchId,
          courtName: court.name,
          branchName: court.branch?.name,
          reason,
        },
        emailData: {
          courtName: court.name,
          branchName: court.branch?.name,
          reason,
        },
        resourceId: court.id,
      },
    );

    return court;
  }

  async suspendCourt(id: string, reason: string, reviewer: SessionUser) {
    const court = await this.courtsService.suspend(id, reason, reviewer);

    await this.notificationsService.notifyStaff(
      { tenantId: court.branch.tenantId },
      {
        email: true,
        type: NotificationType.COURT_SUSPENDED,
        data: {
          kind: NotificationType.COURT_SUSPENDED,
          courtId: court.id,
          branchId: court.branchId,
          courtName: court.name,
          branchName: court.branch?.name,
          reason,
        },
        emailData: {
          resourceType: 'Court',
          resourceName: court.name,
          reason,
        },
        resourceId: court.id,
      },
    );

    return court;
  }

  async unsuspendCourt(id: string, reviewer: SessionUser) {
    const court = await this.courtsService.unsuspend(id, reviewer);

    await this.notificationsService.notifyStaff(
      { tenantId: court.branch.tenantId },
      {
        email: false,
        type: NotificationType.COURT_UNSUSPENDED,
        data: {
          kind: NotificationType.COURT_UNSUSPENDED,
          courtId: court.id,
          branchId: court.branchId,
          courtName: court.name,
          branchName: court.branch?.name,
        },
        resourceId: court.id,
      },
    );

    return court;
  }

  async suspendBranch(id: string, reason: string) {
    const branch = await this.branchesService.suspend(id, reason);

    await this.notificationsService.notifyStaff(
      { tenantId: branch.tenantId },
      {
        email: true,
        type: NotificationType.BRANCH_SUSPENDED,
        data: {
          kind: NotificationType.BRANCH_SUSPENDED,
          branchId: branch.id,
          branchName: branch.name,
          reason,
        },
        emailData: {
          resourceType: 'Branch',
          resourceName: branch.name,
          reason,
        },
        resourceId: branch.id,
      },
    );

    return branch;
  }

  async unsuspendBranch(id: string) {
    const branch = await this.branchesService.unsuspend(id);

    await this.notificationsService.notifyStaff(
      { tenantId: branch.tenantId },
      {
        email: false,
        type: NotificationType.BRANCH_UNSUSPENDED,
        data: {
          kind: NotificationType.BRANCH_UNSUSPENDED,
          branchId: branch.id,
          branchName: branch.name,
        },
        resourceId: branch.id,
      },
    );

    return branch;
  }

  async suspendTenant(id: string, reason: string) {
    await this.tenantsService.blockTenant(id, true, reason);
    const tenant = await this.tenantsService.getTenant(id);

    await this.notificationsService.notifyStaff(
      { tenantId: id },
      {
        email: true,
        type: NotificationType.TENANT_SUSPENDED,
        data: {
          kind: NotificationType.TENANT_SUSPENDED,
          tenantId: id,
          tenantName: tenant.name,
          reason,
        },
        emailData: {
          resourceType: 'Account',
          resourceName: tenant.name,
          reason,
        },
        resourceId: id,
      },
    );

    return tenant;
  }

  async unsuspendTenant(id: string) {
    await this.tenantsService.blockTenant(id, false);
    const tenant = await this.tenantsService.getTenant(id);

    await this.notificationsService.notifyStaff(
      { tenantId: id },
      {
        email: false,
        type: NotificationType.TENANT_UNSUSPENDED,
        data: {
          kind: NotificationType.TENANT_UNSUSPENDED,
          tenantId: id,
          tenantName: tenant.name,
        },
        resourceId: id,
      },
    );

    return tenant;
  }

  async listUnsuspendRequests({
    page = 1,
    pageSize = 10,
  }: { page?: number; pageSize?: number }) {
    const [requests, total] = await this.unsuspendRequestRepository.findAndCount(
      {
        where: { resolvedAt: IsNull() },
        relations: ['tenant'],
        order: { createdAt: 'ASC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      },
    );

    return {
      items: requests,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async resolveUnsuspendRequest(id: string) {
    const request = await this.unsuspendRequestRepository.findOne({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(UNSUSPEND_REQUEST_NOT_FOUND);
    }
    // Claim the request atomically. Read-then-write let two admins (or one
    // double-click) both pass the "still pending" check and each send the
    // vendor an account-unsuspended notification.
    const claimed = await this.unsuspendRequestRepository.update(
      { id, resolvedAt: IsNull() },
      { resolvedAt: new Date(), outcome: UnsuspendRequestOutcome.APPROVED },
    );
    if (claimed.affected === 1) {
      // Resolving a request approves it: lift the suspension and notify the
      // tenant staff (unsuspendTenant emits TENANT_UNSUSPENDED).
      await this.unsuspendTenant(request.tenantId);
    }
    return this.unsuspendRequestRepository.findOne({ where: { id } });
  }

  /**
   * Close a request ops decided against.
   *
   * Approving was the only way out of the inbox, so a request that ops did not
   * intend to grant had to stay pending for ever. A denial resolves the
   * request without touching the suspension, and tells the vendor why —
   * otherwise it is indistinguishable from ops never having looked at it.
   */
  async denyUnsuspendRequest(id: string, reason: string) {
    const request = await this.unsuspendRequestRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });
    if (!request) {
      throw new NotFoundException(UNSUSPEND_REQUEST_NOT_FOUND);
    }

    const claimed = await this.unsuspendRequestRepository.update(
      { id, resolvedAt: IsNull() },
      {
        resolvedAt: new Date(),
        outcome: UnsuspendRequestOutcome.DENIED,
        resolutionReason: reason,
      },
    );
    if (claimed.affected === 1) {
      await this.notificationsService.notifyStaff(
        { tenantId: request.tenantId },
        {
          // In-app + push only: no email template is mapped for this type.
          email: false,
          type: NotificationType.TENANT_UNSUSPEND_DENIED,
          data: {
            kind: NotificationType.TENANT_UNSUSPEND_DENIED,
            tenantId: request.tenantId,
            tenantName: request.tenant?.name,
            reason,
          },
          resourceId: request.id,
        },
      );
    }
    return this.unsuspendRequestRepository.findOne({ where: { id } });
  }

  async listAdmins({ page, pageSize }: { page?: number; pageSize?: number }) {
    return this.staffService.listSuperAdmins({ page, pageSize });
  }

  async createAdmin(dto: CreateOpsAdminDto) {
    return this.staffService.createSuperAdmin(dto);
  }

  async deactivateAdmin(id: string, actor?: SessionUser) {
    if (actor && actor.id === id) {
      throw new BadRequestException(CANNOT_DEACTIVATE_SELF);
    }
    await this.staffService.deactivateSuperAdmin(id);
  }

  async updateAdminRole(id: string, role: StaffRole) {
    return this.staffService.updateSuperAdminRole(id, role);
  }

  async listLogs(query: ListOpsLogsDto) {
    return this.logsService.listLogs(query);
  }

  @OnEvent(CourtEvent.COURT_RESUBMITTED)
  async handleCourtResubmitted({ court }: CourtEventPayload) {
    await this.notificationsService.notifyOps({
      type: NotificationType.COURT_RESUBMITTED,
      data: {
        kind: NotificationType.COURT_RESUBMITTED,
        courtId: court.id,
        branchId: court.branchId,
        courtName: court.name,
        branchName: court.branch?.name,
        tenantId: court.branch?.tenantId,
      },
      resourceId: court.id,
    });
  }
}
