import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import ms from 'ms';

import { OpsService } from './ops.service';
import { ListPendingCourtsDto } from './dto/list-pending-courts.dto';
import { CourtModerationDto } from './dto/court-moderation.dto';
import { CreateOpsAdminDto, UpdateOpsAdminRoleDto } from './dto/ops-admin.dto';
import { ListOpsLogsDto } from './dto/list-ops-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Audited } from 'src/decorators/audited.decorator';
import { LogAction, LogEntity } from '../logging/entities/log.entity';
import { StaffRole } from '../staff/entities/enum';
import type { SessionUser } from '../auth/@types/session';
import { Court } from '../courts/entities/court.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { UnsuspendRequest } from '../tenants/entities/unsuspend-request.entity';
import { PaginationInputDto } from 'src/common/pagination.input.dto';

@ApiTags('Ops')
@ApiBearerAuth()
@Controller('ops')
@UseGuards(JwtAuthGuard, UserTypeGuard, ThrottlerGuard)
@Throttle({
  auth: { limit: 300, ttl: ms('15m') },
  phone: { limit: 300, ttl: ms('15m') },
})
@AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN])
export class OpsController {
  constructor(private readonly opsService: OpsService) { }

  @Get('courts/pending')
  @ApiOperation({
    summary: 'List courts in the moderation queue',
    description:
      'Returns courts pending approval (default) or filtered by another moderation status, including branch, tenant and media assets.',
  })
  @ApiResponse({ status: 200, description: 'Paginated review queue' })
  listPendingCourts(@Query() query: ListPendingCourtsDto) {
    return this.opsService.listPendingCourts(query);
  }

  @Post('courts/:id/approve')
  @Audited(LogEntity.COURT, LogAction.UPDATE)
  @ApiOperation({ summary: 'Approve a court (pending_approval → available)' })
  @ApiResponse({ status: 200, type: Court })
  @ApiParam({ name: 'id', type: String })
  approveCourt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.opsService.approveCourt(id, user);
  }

  @Post('courts/:id/request-changes')
  @Audited(LogEntity.COURT, LogAction.UPDATE)
  @ApiOperation({
    summary: 'Request changes on a court (pending_approval → changes_requested)',
  })
  @ApiResponse({ status: 200, type: Court })
  @ApiParam({ name: 'id', type: String })
  requestCourtChanges(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CourtModerationDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.opsService.requestCourtChanges(id, dto.reason, user);
  }

  @Post('courts/:id/suspend')
  @Audited(LogEntity.COURT, LogAction.UPDATE)
  @ApiOperation({
    summary: 'Suspend a court (available/pending_approval → suspended)',
  })
  @ApiResponse({ status: 200, type: Court })
  @ApiParam({ name: 'id', type: String })
  suspendCourt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CourtModerationDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.opsService.suspendCourt(id, dto.reason, user);
  }

  @Post('courts/:id/unsuspend')
  @Audited(LogEntity.COURT, LogAction.UPDATE)
  @ApiOperation({ summary: 'Unsuspend a court (suspended → available)' })
  @ApiResponse({ status: 200, type: Court })
  @ApiParam({ name: 'id', type: String })
  unsuspendCourt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.opsService.unsuspendCourt(id, user);
  }

  @Post('branches/:id/suspend')
  @Audited(LogEntity.BRANCH, LogAction.UPDATE)
  @ApiOperation({ summary: 'Suspend a branch (hides it from customers)' })
  @ApiResponse({ status: 200, type: Branch })
  @ApiParam({ name: 'id', type: String })
  suspendBranch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CourtModerationDto,
  ): Promise<Branch> {
    return this.opsService.suspendBranch(id, dto.reason);
  }

  @Post('branches/:id/unsuspend')
  @Audited(LogEntity.BRANCH, LogAction.UPDATE)
  @ApiOperation({ summary: 'Unsuspend a branch' })
  @ApiResponse({ status: 200, type: Branch })
  @ApiParam({ name: 'id', type: String })
  unsuspendBranch(@Param('id', ParseUUIDPipe) id: string): Promise<Branch> {
    return this.opsService.unsuspendBranch(id);
  }

  @Post('tenants/:id/suspend')
  @Audited(LogEntity.TENANT, LogAction.UPDATE)
  @ApiOperation({
    summary: 'Suspend a tenant (vendor can still log in to fix issues)',
  })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiParam({ name: 'id', type: String })
  suspendTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CourtModerationDto,
  ): Promise<Tenant> {
    return this.opsService.suspendTenant(id, dto.reason);
  }

  @Post('tenants/:id/unsuspend')
  @Audited(LogEntity.TENANT, LogAction.UPDATE)
  @ApiOperation({ summary: 'Unsuspend a tenant' })
  @ApiResponse({ status: 200, type: Tenant })
  @ApiParam({ name: 'id', type: String })
  unsuspendTenant(@Param('id', ParseUUIDPipe) id: string): Promise<Tenant> {
    return this.opsService.unsuspendTenant(id);
  }

  @Get('unsuspend-requests')
  @ApiOperation({ summary: 'List pending tenant unsuspend requests' })
  @ApiResponse({ status: 200, description: 'Paginated unsuspend requests' })
  listUnsuspendRequests(@Query() query: PaginationInputDto) {
    return this.opsService.listUnsuspendRequests(query);
  }

  @Post('unsuspend-requests/:id/resolve')
  @Audited(LogEntity.UNSUSPEND_REQUEST, LogAction.UPDATE)
  @ApiOperation({ summary: 'Mark an unsuspend request as resolved' })
  @ApiResponse({ status: 200, type: UnsuspendRequest })
  @ApiParam({ name: 'id', type: String })
  resolveUnsuspendRequest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UnsuspendRequest> {
    return this.opsService.resolveUnsuspendRequest(id);
  }

  @Get('admins')
  @ApiOperation({ summary: 'List ops admins (SUPER_ADMIN staff)' })
  @ApiResponse({ status: 200, description: 'Paginated ops admins' })
  listAdmins(@Query() query: PaginationInputDto) {
    return this.opsService.listAdmins(query);
  }

  @Post('admins')
  @Audited(LogEntity.OPS_ADMIN, LogAction.CREATE)
  @ApiOperation({ summary: 'Create an ops admin (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: 'The created admin' })
  createAdmin(@Body() dto: CreateOpsAdminDto) {
    return this.opsService.createAdmin(dto);
  }

  @Patch('admins/:id/deactivate')
  @Audited(LogEntity.OPS_ADMIN, LogAction.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate an ops admin',
    description: 'The last active SUPER_ADMIN cannot be deactivated.',
  })
  @ApiResponse({ status: 204, description: 'Admin deactivated' })
  @ApiParam({ name: 'id', type: String })
  async deactivateAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.opsService.deactivateAdmin(id);
  }

  @Patch('admins/:id/role')
  @Audited(LogEntity.OPS_ADMIN, LogAction.UPDATE)
  @ApiOperation({
    summary: 'Change an ops admin role',
    description: 'The last active SUPER_ADMIN cannot be demoted.',
  })
  @ApiResponse({ status: 200, description: 'The updated admin' })
  @ApiParam({ name: 'id', type: String })
  updateAdminRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpsAdminRoleDto,
  ) {
    return this.opsService.updateAdminRole(id, dto.role);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Query audit logs',
    description:
      'Filterable by actor, entity, action and date range. Paginated.',
  })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  listLogs(@Query() query: ListOpsLogsDto) {
    return this.opsService.listLogs(query);
  }
}
