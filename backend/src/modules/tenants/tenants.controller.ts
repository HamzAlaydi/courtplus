import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantPreferencesDto } from './dto/update-tenant-preferences.dto';
import { Tenant } from './entities/tenant.entity';
import { TenantPreferences } from './entities/tenant-preferences.entity';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StaffRole } from 'src/modules/staff/entities/enum';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@AuthorizedUserType.isStaff()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Get()
  @ApiOperation({ summary: 'Get tenant profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the tenant profile',
    type: UpdateTenantDto,
  })
  getTenant(@CurrentUser() user: SessionUser): Promise<Tenant> {
    return this.tenantsService.getTenant(user.tenantId);
  }
  @Patch()
  @ApiOperation({ summary: 'Update tenant profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated tenant profile',
    type: Tenant,
  })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  updateTenant(
    @CurrentUser() user: SessionUser,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    return this.tenantsService.updateTenant(user.tenantId, updateTenantDto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get tenant preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the tenant preferences',
    type: TenantPreferences,
  })
  getPreferences(@CurrentUser() user: SessionUser): Promise<TenantPreferences> {
    return this.tenantsService.getPreferences(user.tenantId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update tenant preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated tenant preferences',
    type: TenantPreferences,
  })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  updatePreferences(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateTenantPreferencesDto,
  ): Promise<TenantPreferences> {
    return this.tenantsService.updatePreferences(user, dto);
  }
}
