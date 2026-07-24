import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { DateRangeInput } from './dto/date-range-input';
import { TenantStatsDto } from './dto/tenant-stats.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from '../auth/@types/session';

@Controller('stats')
@ApiTags('Stats')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@AuthorizedUserType.isStaff()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('/tenant')
  @ApiOperation({
    summary: 'Get stats for a branch, court, user, staff member, or tenant',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns stats including revenue, bookings, reviews, and pending matches',
    type: TenantStatsDto,
  })
  async getTenantStats(
    @Query() query: DateRangeInput,
    @CurrentUser() user: SessionUser,
  ): Promise<TenantStatsDto> {
    return this.statsService.getTenantStats({
      tenantId: user.tenantId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }
}
