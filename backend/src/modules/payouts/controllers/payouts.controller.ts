import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { PayoutsService } from '../services/payouts.service';
import { BalanceService } from '../services/balance.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { StaffRole } from 'src/modules/staff/entities/enum';
import { RequestPayoutDto } from '../dto/request-payout.dto';
import { StartOnboardingDto } from '../dto/start-onboarding.dto';
import { MarkPayoutSentDto } from '../dto/mark-payout-sent.dto';
import { RejectPayoutDto } from '../dto/reject-payout.dto';
import { UpdatePayoutSettingsDto } from '../dto/update-payout-settings.dto';
import { ListPayoutsResponseDto } from '../dto/payout-response.dto';
import { ListPayoutsQueryDto } from '../dto/list-payouts-query.dto';
import { ListTransactionsResponseDto } from '../dto/transaction-response.dto';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { Payout } from '../entities/payout.entity';
import { TenantBalance } from '../entities/tenant-balance.entity';
import { TenantPayoutSettings } from '../entities/tenant-payout-settings.entity';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { Audited } from 'src/decorators/audited.decorator';
import { LogAction, LogEntity } from 'src/modules/logging/entities/log.entity';

@Controller('payouts')
@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserTypeGuard)
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly balanceService: BalanceService,
  ) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get tenant balance' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async getBalance(@CurrentUser() user: SessionUser): Promise<TenantBalance> {
    return this.balanceService.getBalance(user.tenantId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List balance transactions' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async listTransactions(
    @CurrentUser() user: SessionUser,
    @Query() query: PaginationInputDto,
  ): Promise<ListTransactionsResponseDto> {
    const { data, totalCount } = await this.balanceService.getTransactions(
      user.tenantId,
      query.page,
      query.pageSize,
    );

    return {
      items: data,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / query.pageSize),
        currentPage: query.page,
      },
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get payout settings' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async getPayoutSettings(
    @CurrentUser() user: SessionUser,
  ): Promise<TenantPayoutSettings> {
    return this.payoutsService.getPayoutSettings(user.tenantId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update payout settings' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async updatePayoutSettings(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdatePayoutSettingsDto,
  ): Promise<TenantPayoutSettings> {
    return this.payoutsService.updatePayoutSettings(user.tenantId, dto);
  }

  @Get('account/status')
  @ApiOperation({ summary: 'Get payout account status' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async getAccountStatus(
    @CurrentUser() user: SessionUser,
  ): Promise<{ isConfigured: boolean; isActive?: boolean; provider?: string }> {
    return this.payoutsService.getAccountStatus(user.tenantId);
  }

  @Post('account/onboard')
  @ApiOperation({
    summary: 'Start or resume Stripe Connect onboarding; returns the hosted URL',
  })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async startOnboarding(
    @CurrentUser() user: SessionUser,
    @Body() dto: StartOnboardingDto,
  ): Promise<{ url: string }> {
    return this.payoutsService.startOnboarding(
      user.tenantId,
      user.email,
      dto.country,
    );
  }

  @Post('request')
  @ApiOperation({ summary: 'Request a payout' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async requestPayout(
    @CurrentUser() user: SessionUser,
    @Body() dto: RequestPayoutDto,
  ): Promise<Payout> {
    return this.payoutsService.requestPayout(user.tenantId, user.id, dto);
  }

  // Payout decisions move vendor money but carried no @Audited, so approving,
  // rejecting or marking one sent left no trace of who did it.
  @Post(':id/mark-sent')
  @ApiOperation({
    summary: 'Record that a manual bank transfer for this payout has been sent',
  })
  @AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN])
  @Audited(LogEntity.PAYOUT, LogAction.UPDATE)
  async markPayoutSent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarkPayoutSentDto,
  ): Promise<Payout> {
    return this.payoutsService.markPayoutSent(id, dto.reference);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve and process a pending payout' })
  @AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN])
  @Audited(LogEntity.PAYOUT, LogAction.UPDATE)
  async approvePayout(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Payout> {
    return this.payoutsService.approvePayout(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending payout' })
  @AuthorizedUserType.isStaff([StaffRole.SUPER_ADMIN])
  @Audited(LogEntity.PAYOUT, LogAction.UPDATE)
  async rejectPayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPayoutDto,
  ): Promise<Payout> {
    return this.payoutsService.rejectPayout(id, dto.reason);
  }

  @Get()
  @ApiOperation({ summary: 'List payouts' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.SUPER_ADMIN])
  async listPayouts(
    @CurrentUser() user: SessionUser,
    @Query() query: ListPayoutsQueryDto,
  ): Promise<ListPayoutsResponseDto> {
    return this.payoutsService.listPayouts(
      user.role === StaffRole.SUPER_ADMIN ? undefined : user.tenantId,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payout details' })
  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.SUPER_ADMIN])
  async getPayout(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Payout> {
    return this.payoutsService.getPayout(
      user.role === StaffRole.SUPER_ADMIN ? undefined : user.tenantId,
      id,
    );
  }
}
