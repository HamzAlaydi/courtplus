import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportEntity, ReportStatus } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { ListReportsResultDto } from './dto/list-reports-response.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ReportEvent } from './reporting.events';
import type { ReportCreatedEventPayload } from './reporting.events';
import { UsersService } from '../users/users.service';
import {
  BRANCH_NOT_FOUND,
  COURT_NOT_FOUND,
  USER_NOT_FOUND,
} from '../shared/error-codes';
import { BranchesService } from '../branches/branches.service';
import { CourtsService } from '../courts/courts.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { StaffService } from '../staff/staff.service';
import { EmailService, EmailTemplate } from '../shared/services/email.service';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly branchesService: BranchesService,
    private readonly courtsService: CourtsService,
    private readonly notificationsService: NotificationsService,
    private readonly staffService: StaffService,
    private readonly emailService: EmailService,
  ) { }

  async createReport(
    data: CreateReportDto,
    reporterId: string,
  ): Promise<Report> {
    const { entityId, entity, reason, description } = data;

    switch (entity) {
      case ReportEntity.USER:
        const user = await this.usersService.exists({ id: entityId });
        if (!user) {
          throw new NotFoundException(USER_NOT_FOUND);
        }
        break;
      case ReportEntity.BRANCH:
        const branch = await this.branchesService.exists(entityId);
        if (!branch) {
          throw new NotFoundException(BRANCH_NOT_FOUND);
        }
        break;
      case ReportEntity.COURT:
        const court = await this.courtsService.exists(entityId);
        if (!court) {
          throw new NotFoundException(COURT_NOT_FOUND);
        }
        break;
    }

    const report = await this.reportRepository.save({
      entityId,
      entityType: entity,
      reason,
      description,
      reporterId,
      status: ReportStatus.PENDING,
    });

    this.eventEmitter.emit(ReportEvent.REPORT_CREATED, {
      report,
    });

    return report;
  }

  async listReports(query: ListReportsDto): Promise<ListReportsResultDto> {
    const { reporterId, entityId, entityType, status, page, pageSize } = query;
    const qb = this.reportRepository.createQueryBuilder('report');
    if (reporterId)
      qb.andWhere('report.reporterId = :reporterId', {
        reporterId,
      });
    if (entityId)
      qb.andWhere('report.entityId = :entityId', {
        entityId,
      });
    if (entityType)
      qb.andWhere('report.entityType = :entityType', { entityType });
    if (status) qb.andWhere('report.status = :status', { status });
    const [reports, total] = await qb.getManyAndCount();
    return {
      items: reports,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    };
  }

  @OnEvent(ReportEvent.REPORT_CREATED)
  private async handleReportCreated(
    payload: ReportCreatedEventPayload,
  ): Promise<void> {
    const { report } = payload;

    if (
      ![ReportEntity.BRANCH, ReportEntity.COURT].includes(report.entityType)
    ) {
      return;
    }

    let tenantId: string | null = null;
    let entityName: string = '';
    let entityDetails: any = {};

    try {
      if (report.entityType === ReportEntity.BRANCH) {
        const branch = await this.branchesService.findOne(report.entityId);
        if (branch) {
          tenantId = branch.tenantId;
          entityName = branch.name;
          entityDetails = {
            branchName: branch.name,
            branchId: branch.id,
            address: 'N/A',
          };
        }
      } else if (report.entityType === ReportEntity.COURT) {
        const court = await this.courtsService.findOne(report.entityId, {
          branch: true,
        });
        if (court?.branch) {
          tenantId = court.branch.tenantId;
          entityName = `${court.name} (${court.branch.name})`;
          entityDetails = {
            courtName: court.name,
            courtId: court.id,
            branchName: court.branch.name,
            branchId: court.branch.id,
          };
        }
      }

      if (!tenantId) {
        console.warn(
          `Could not find tenant for ${report.entityType} report: ${report.entityId}`,
        );
        return;
      }

      const reporter = await this.usersService.getById(report.reporterId);
      const reporterName = reporter
        ? `${reporter.firstName} ${reporter.lastName}`.trim()
        : 'Unknown User';

      const notificationType = NotificationType.REPORT_CREATED;




      await this.notificationsService.notifyStaff({ tenantId }, {
        type: notificationType,
        data: {
          reportId: report.id,
        },
        resourceId: report.id,
      });

    } catch (error) {
      console.error('Error handling report created event:', error);
    }
  }
}
