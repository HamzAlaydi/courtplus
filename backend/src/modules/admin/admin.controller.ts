import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { StaffRole } from '../staff/entities/enum';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { AdminListUsersDto } from './dto/admin-users.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ListUsersResponseDto } from '../users/dto/list-users-response.dto';
import { ListTenantsDto, ListTenantsResponseDto } from './dto/admin-tenants.dto';
import type { SessionUser } from '../auth/@types/session';
import { Audited } from 'src/decorators/audited.decorator';
import { LogAction, LogEntity } from '../logging/entities/log.entity';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN])
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) { }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all users',
    type: ListUsersResponseDto,
  })
  async listUsers(
    @Query() query: AdminListUsersDto,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<ListUsersResponseDto> {
    return this.usersService.find(query, currentUser);
  }

  @Patch('users/:id/block')
  @AuthorizedUserType.isStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.OWNER,
    StaffRole.ADMIN,
  ])
  @Audited(LogEntity.USER, LogAction.UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({
    status: 204,
    description: 'User blocked successfully',
  })
  async blockUser(@Param('id', ParseUUIDPipe) userId: string): Promise<void> {
    await this.usersService.blockUser(userId, true);
  }

  @Patch('users/:id/unblock')
  @AuthorizedUserType.isStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.OWNER,
    StaffRole.ADMIN,
  ])
  @Audited(LogEntity.USER, LogAction.UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({
    status: 204,
    description: 'User unblocked successfully',
  })
  async unblockUser(@Param('id', ParseUUIDPipe) userId: string): Promise<void> {
    await this.usersService.blockUser(userId, false);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of all tenants with stats',
    type: ListTenantsResponseDto,
  })
  async listTenants(
    @Query() query: ListTenantsDto,
  ): Promise<ListTenantsResponseDto> {
    return this.tenantsService.listTenants(query);
  }

  @Patch('tenants/:id/block')
  @Audited(LogEntity.TENANT, LogAction.UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Block a tenant' })
  @ApiResponse({
    status: 204,
    description: 'Tenant blocked successfully',
  })
  async blockTenant(
    @Param('id', ParseUUIDPipe) tenantId: string,
  ): Promise<void> {
    await this.tenantsService.blockTenant(tenantId, true);
  }

  @Patch('tenants/:id/unblock')
  @Audited(LogEntity.TENANT, LogAction.UPDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a tenant' })
  @ApiResponse({
    status: 204,
    description: 'Tenant unblocked successfully',
  })
  async unblockTenant(
    @Param('id', ParseUUIDPipe) tenantId: string,
  ): Promise<void> {
    await this.tenantsService.blockTenant(tenantId, false);
  }
}
