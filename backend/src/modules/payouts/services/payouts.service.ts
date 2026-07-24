import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { Payout } from '../entities/payout.entity';
import { TenantPayoutSettings } from '../entities/tenant-payout-settings.entity';
import { BalanceService } from './balance.service';
import { PayoutProviderFactory } from '../providers/payout-provider.factory';
import { RequestPayoutDto } from '../dto/request-payout.dto';
import { UpdatePayoutSettingsDto } from '../dto/update-payout-settings.dto';
import { ListPayoutsQueryDto } from '../dto/list-payouts-query.dto';
import { PayoutStatus, PayoutConstants } from '../constants/payout.constants';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepo: Repository<Payout>,
    @InjectRepository(TenantPayoutSettings)
    private readonly settingsRepo: Repository<TenantPayoutSettings>,
    private readonly balanceService: BalanceService,
    private readonly providerFactory: PayoutProviderFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Transactional()
  async requestPayout(
    tenantId: string,
    staffId: string,
    dto: RequestPayoutDto,
  ): Promise<Payout> {
    const balance = await this.balanceService.getBalance(tenantId);

    if (balance.availableBalance < dto.amount) {
      throw new BadRequestException('INSUFFICIENT_BALANCE');
    }

    const settings = await this.settingsRepo.findOne({
      where: { tenantId, isActive: true },
    });

    if (!settings) {
      throw new BadRequestException('PAYOUT_ACCOUNT_NOT_CONFIGURED');
    }

    if (dto.amount < PayoutConstants.DEFAULT_MIN_PAYOUT_AMOUNT) {
      throw new BadRequestException('AMOUNT_BELOW_MINIMUM');
    }

    const pendingPayouts = await this.payoutRepo.count({
      where: {
        tenantId,
        status: In([PayoutStatus.PENDING, PayoutStatus.PROCESSING]),
      },
    });

    if (pendingPayouts > 0) {
      throw new BadRequestException('PENDING_PAYOUT_EXISTS');
    }

    const payout = this.payoutRepo.create({
      tenantId,
      amount: dto.amount,
      currency: balance.currency,
      status: PayoutStatus.PENDING,
      provider: settings.provider,
      requestedByStaffId: staffId,
    });

    await this.payoutRepo.save(payout);

    await this.balanceService.deductPayout(
      tenantId,
      payout.id,
      dto.amount,
      balance.currency,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('payout.requested', { payout });
    });

    return payout;
  }

  @Transactional()
  async approvePayout(payoutId: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('PAYOUT_NOT_PENDING');
    }

    const settings = await this.settingsRepo.findOne({
      where: { tenantId: payout.tenantId, isActive: true },
    });

    if (!settings) {
      throw new BadRequestException('PAYOUT_ACCOUNT_NOT_CONFIGURED');
    }

    try {
      const provider = this.providerFactory.getProvider(settings.provider);

      const result = await provider.createPayout({
        tenantId: payout.tenantId,
        amount: payout.amount,
        currency: payout.currency,
        destinationAccount: settings.providerAccountId,
        metadata: {
          payoutId: payout.id,
          tenantId: payout.tenantId,
        },
      });

      payout.providerPayoutId = result.providerPayoutId;
      payout.status = result.status;
      payout.metadata = result.metadata;
      await this.payoutRepo.save(payout);

      runOnTransactionCommit(() => {
        this.eventEmitter.emit('payout.approved', { payout });
      });

      return payout;
    } catch (error) {
      await this.balanceService.refundFailedPayout(
        payout.tenantId,
        payout.id,
        payout.amount,
        payout.currency,
      );

      payout.status = PayoutStatus.FAILED;
      payout.failureReason = error.message;
      await this.payoutRepo.save(payout);

      throw new BadRequestException('PAYOUT_CREATION_FAILED');
    }
  }

  @Transactional()
  async rejectPayout(payoutId: string, reason: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('PAYOUT_NOT_PENDING');
    }

    payout.status = PayoutStatus.CANCELLED;
    payout.failureReason = reason;
    await this.payoutRepo.save(payout);

    await this.balanceService.refundFailedPayout(
      payout.tenantId,
      payout.id,
      payout.amount,
      payout.currency,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('payout.rejected', { payout });
    });

    return payout;
  }

  @Transactional()
  async completePayoutFromProvider(providerPayoutId: string): Promise<void> {
    const payout = await this.payoutRepo.findOne({
      where: { providerPayoutId },
    });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.sentAt = new Date();
    await this.payoutRepo.save(payout);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('payout.completed', { payout });
    });
  }

  @Transactional()
  async failPayoutFromProvider(
    providerPayoutId: string,
    failureReason: string,
  ): Promise<void> {
    const payout = await this.payoutRepo.findOne({
      where: { providerPayoutId },
    });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    payout.status = PayoutStatus.FAILED;
    payout.failureReason = failureReason;
    await this.payoutRepo.save(payout);

    await this.balanceService.refundFailedPayout(
      payout.tenantId,
      payout.id,
      payout.amount,
      payout.currency,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('payout.failed', { payout });
    });
  }

  async updatePayoutStatus(
    providerPayoutId: string,
    status: PayoutStatus,
  ): Promise<void> {
    const payout = await this.payoutRepo.findOne({
      where: { providerPayoutId },
    });

    if (payout) {
      payout.status = status;
      await this.payoutRepo.save(payout);
    }
  }

  async updatePayoutSettings(
    tenantId: string,
    dto: UpdatePayoutSettingsDto,
  ): Promise<TenantPayoutSettings> {
    let settings = await this.settingsRepo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      settings = this.settingsRepo.create({ tenantId });
    }

    Object.assign(settings, dto);

    return this.settingsRepo.save(settings);
  }

  async getPayoutSettings(tenantId: string): Promise<TenantPayoutSettings> {
    const settings = await this.settingsRepo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      throw new NotFoundException('PAYOUT_ACCOUNT_NOT_CONFIGURED');
    }

    return settings;
  }

  async getAccountStatus(
    tenantId: string,
  ): Promise<{ isConfigured: boolean; isActive?: boolean; provider?: string }> {
    const settings = await this.settingsRepo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      return { isConfigured: false };
    }

    return {
      isConfigured: true,
      isActive: settings.isActive,
      provider: settings.provider,
    };
  }

  async updateAccountStatus(tenantId: string, isActive: boolean): Promise<void> {
    const settings = await this.settingsRepo.findOne({
      where: { tenantId },
    });

    if (settings) {
      settings.isActive = isActive;
      await this.settingsRepo.save(settings);
    }
  }

  async listPayouts(
    tenantId: string,
    query: ListPayoutsQueryDto,
  ): Promise<EntityListResultDto<Payout>> {
    const qb = this.payoutRepo
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.requestedBy', 'staff')
      .where('payout.tenantId = :tenantId', { tenantId });

    if (query.status) {
      qb.andWhere('payout.status = :status', { status: query.status });
    }

    if (query.startDate) {
      qb.andWhere('payout.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('payout.createdAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    qb.orderBy('payout.createdAt', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);

    const [items, totalCount] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / query.pageSize),
        currentPage: query.page,
      },
    };
  }

  async getPayout(tenantId: string, payoutId: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({
      where: { id: payoutId, tenantId },
      relations: ['requestedBy'],
    });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    return payout;
  }

  @OnEvent('payout.requested')
  async onPayoutRequested(payload: { payout: Payout }) {
    this.logger.log(`Payout requested: ${payload.payout.id}`);
  }

  @OnEvent('payout.completed')
  async onPayoutCompleted(payload: { payout: Payout }) {
    this.logger.log(`Payout completed: ${payload.payout.id}`);
  }

  @OnEvent('payout.failed')
  async onPayoutFailed(payload: { payout: Payout }) {
    this.logger.log(`Payout failed: ${payload.payout.id}`);
  }
}
