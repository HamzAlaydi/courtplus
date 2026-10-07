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
import {
  PayoutStatus,
  PayoutConstants,
  PayoutProvider,
} from '../constants/payout.constants';
import { ConfigService } from '@nestjs/config';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

/** Vendor-facing text for a failed payout; provider detail goes to metadata. */
const PAYOUT_FAILURE_REASON =
  'The transfer could not be completed. Court+ support has been notified.';

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
    private readonly configService: ConfigService,
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

  // NOTE: intentionally NOT @Transactional — the catch below performs
  // compensating writes (refund + FAILED status) and then rethrows.
  // Inside a transaction the rethrow would roll the compensation back,
  // leaving the payout stuck in `pending` with the funds still deducted.
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

    // Claim the payout atomically BEFORE touching the provider. Two ops
    // admins clicking Approve (or one double-submit) both used to pass the
    // status check above and each send a transfer, paying the vendor twice.
    // Only the request that flips pending -> processing may continue.
    const claimed = await this.payoutRepo.update(
      { id: payout.id, status: PayoutStatus.PENDING },
      { status: PayoutStatus.PROCESSING },
    );
    if (claimed.affected !== 1) {
      throw new BadRequestException('PAYOUT_NOT_PENDING');
    }
    payout.status = PayoutStatus.PROCESSING;

    let transferSent = false;
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
        // Stripe de-duplicates on this key, so a retried request after a
        // timeout returns the ORIGINAL transfer instead of sending a second.
        idempotencyKey: `payout_${payout.id}`,
      });
      transferSent = true;

      payout.providerPayoutId = result.providerPayoutId;
      payout.status = result.status;
      payout.metadata = result.metadata;
      await this.payoutRepo.save(payout);

      // Plain emit: this method is deliberately not @Transactional, and
      // runOnTransactionCommit THROWS outside a transaction ("No hook manager
      // found in context"). That throw landed in the catch below, which
      // refunded the balance after the money had already left the platform —
      // every approved payout paid the vendor twice.
      this.eventEmitter.emit('payout.approved', { payout });

      return payout;
    } catch (error) {
      if (transferSent) {
        // The money HAS left the platform. Never compensate here: the payout
        // stays PROCESSING and the transfer.created/updated webhook settles
        // it. Surfaced loudly because it needs a human to reconcile.
        this.logger.error(
          `Payout ${payout.id} transfer succeeded but bookkeeping failed; left in PROCESSING for webhook reconciliation: ${(error as Error).message}`,
          (error as Error).stack,
        );
        return payout;
      }

      await this.balanceService.refundFailedPayout(
        payout.tenantId,
        payout.id,
        payout.amount,
        payout.currency,
      );

      payout.status = PayoutStatus.FAILED;
      // The raw provider message is developer text ("You passed an empty
      // string for 'destination'..."); vendors see failureReason in their
      // payout history, so keep the detail in metadata for ops instead.
      payout.failureReason = PAYOUT_FAILURE_REASON;
      payout.metadata = {
        ...(payout.metadata || {}),
        providerError: (error as Error).message,
      };
      await this.payoutRepo.save(payout);

      // The vendor has to be told. This is by far the commonest way a payout
      // fails — a closed connected account, a destination without transfer
      // capability, an insufficient platform balance — yet the only emit of
      // this event lived in failPayoutFromProvider, which Stripe reaches only
      // on `transfer.reversed`. Without this line the whole PAYOUT_FAILED
      // path (notification row, push and email) was unreachable in practice:
      // the money quietly returned to their balance and ops saw a 400.
      //
      // A plain emit, not runOnTransactionCommit: approvePayout is
      // deliberately not @Transactional, and the commit hook throws outside a
      // transaction — which here would swallow the coded 400 and still never
      // notify anyone.
      this.eventEmitter.emit('payout.failed', { payout });

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

    // Same atomic claim as approve: without it, approve and reject racing on
    // one payout ended with the transfer sent AND the balance restored.
    const claimed = await this.payoutRepo.update(
      { id: payout.id, status: PayoutStatus.PENDING },
      { status: PayoutStatus.CANCELLED, failureReason: reason },
    );
    if (claimed.affected !== 1) {
      throw new BadRequestException('PAYOUT_NOT_PENDING');
    }
    payout.status = PayoutStatus.CANCELLED;
    payout.failureReason = reason;

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

    // Bank details make a tenant payable by bank transfer even where Stripe
    // Connect cannot onboard them. Without this the row stayed isActive=false
    // and every payout request was refused with PAYOUT_ACCOUNT_NOT_CONFIGURED,
    // no matter what the vendor filled in.
    const hasBankDestination = !!(settings.iban || settings.accountNumber);
    if (hasBankDestination && !settings.providerAccountId) {
      settings.provider = PayoutProvider.CUSTOM;
      settings.providerAccountId =
        settings.providerAccountId || `manual_${tenantId}`;
      settings.isActive = true;
    }

    return this.settingsRepo.save(settings);
  }

  /**
   * Close out a bank transfer that ops has actually sent.
   *
   * The manual provider leaves payouts in PROCESSING because no API moved the
   * money; this is the human confirmation that it did.
   */
  async markPayoutSent(payoutId: string, reference?: string): Promise<Payout> {
    const payout = await this.payoutRepo.findOne({ where: { id: payoutId } });

    if (!payout) {
      throw new NotFoundException('PAYOUT_NOT_FOUND');
    }

    // Atomic, like approve/reject: two admins confirming the same transfer
    // must not both emit a completion.
    const sentAt = new Date();
    const claimed = await this.payoutRepo.update(
      { id: payout.id, status: PayoutStatus.PROCESSING },
      { status: PayoutStatus.COMPLETED, sentAt },
    );
    if (claimed.affected !== 1) {
      throw new BadRequestException('PAYOUT_NOT_PROCESSING');
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.sentAt = sentAt;
    if (reference) {
      payout.metadata = { ...(payout.metadata || {}), bankReference: reference };
      await this.payoutRepo.save(payout);
    }
    this.eventEmitter.emit('payout.completed', { payout });
    return payout;
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

  async getAccountStatus(tenantId: string): Promise<{
    isConfigured: boolean;
    isActive?: boolean;
    provider?: string;
  }> {
    const settings = await this.settingsRepo.findOne({
      where: { tenantId },
    });

    if (!settings) {
      return { isConfigured: false };
    }

    // Refresh readiness from the provider while onboarding is incomplete, so
    // the vendor sees "ready" right after returning from Stripe instead of
    // waiting for the account.updated webhook.
    if (settings.providerAccountId && !settings.isActive) {
      try {
        const provider = this.providerFactory.getProvider(settings.provider);
        const status = await provider.getAccountStatus(
          settings.providerAccountId,
        );
        if (status.isActive) {
          settings.isActive = true;
          await this.settingsRepo.save(settings);
        }
      } catch (error) {
        this.logger.warn(
          `Could not refresh payout account status for tenant ${tenantId}: ${(error as Error).message}`,
        );
      }
    }

    return {
      // "configured" means a provider account exists; a bank-details-only row
      // (the old PUT /settings path) is not something we can pay out to.
      isConfigured: !!settings.providerAccountId,
      isActive: settings.isActive,
      provider: settings.provider,
    };
  }

  /**
   * Start (or resume) Stripe Connect onboarding for the tenant and return
   * the hosted onboarding URL. Nothing ever called createConnectedAccount
   * before, so no vendor could become payout-ready.
   */
  async startOnboarding(
    tenantId: string,
    requesterEmail: string | undefined,
    country?: string,
  ): Promise<{ url: string }> {
    let settings = await this.settingsRepo.findOne({ where: { tenantId } });
    if (!settings) {
      // Persisted BEFORE the provider call. The row used to be created in
      // memory, the Stripe account created, and only then saved — and because
      // `bankName` was NOT NULL the save failed, leaving an orphaned Express
      // account behind on every click.
      settings = await this.settingsRepo.save(
        this.settingsRepo.create({
          tenantId,
          provider: PayoutProvider.STRIPE,
          isActive: false,
        }),
      );
    }
    const provider = this.providerFactory.getProvider(
      settings.provider || PayoutProvider.STRIPE,
    );

    if (settings.providerAccountId) {
      if (!provider.createOnboardingLink) {
        throw new BadRequestException('PAYOUT_PROVIDER_UNSUPPORTED');
      }
      return {
        url: await this.callProvider(tenantId, () =>
          provider.createOnboardingLink(settings.providerAccountId),
        ),
      };
    }

    const [tenant]: Array<{ name: string | null; email: string | null }> =
      await this.settingsRepo.manager.query(
        `SELECT t.name, s.email FROM tenants t LEFT JOIN staff s ON s.id = t."ownerId" WHERE t.id = $1`,
        [tenantId],
      );
    const account = await this.callProvider(tenantId, () =>
      provider.createConnectedAccount(tenantId, {
        country: (
          country ||
          this.configService.get<string>('payouts.defaultCountry') ||
          'SA'
        ).toUpperCase(),
        email: requesterEmail || tenant?.email || undefined,
        businessName:
          tenant?.name || settings.accountHolderName || 'Court+ venue',
      }),
    );

    // Store the account id immediately, even if the link step fails, so a
    // retry reuses this account instead of creating another one.
    settings.providerAccountId = account.accountId;
    settings.isActive = false;
    await this.settingsRepo.save(settings);

    if (!account.onboardingUrl) {
      throw new BadRequestException('PAYOUT_PROVIDER_UNSUPPORTED');
    }
    return { url: account.onboardingUrl };
  }

  /**
   * Run a payout-provider call and turn its errors into a coded 400.
   *
   * Uncaught, a Stripe `invalid_request_error` (unsupported country, missing
   * capability, bad key) surfaced as a bare 500 and the vendor saw only
   * "Something went wrong", with nothing logged against the tenant.
   */
  private async callProvider<T>(
    tenantId: string,
    call: () => Promise<T>,
  ): Promise<T> {
    try {
      return await call();
    } catch (error) {
      const message = (error as Error).message || 'unknown provider error';
      this.logger.error(
        `Payout provider call failed for tenant ${tenantId}: ${message}`,
      );
      if (/not supported|not currently supported|country/i.test(message)) {
        throw new BadRequestException('PAYOUT_COUNTRY_NOT_SUPPORTED');
      }
      throw new BadRequestException('PAYOUT_PROVIDER_ERROR');
    }
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
    tenantId: string | undefined,
    query: ListPayoutsQueryDto,
  ): Promise<EntityListResultDto<Payout>> {
    // Explicit columns. leftJoinAndSelect pulled the WHOLE Staffer row —
    // including the bcrypt `password` hash and pendingEmail — and the whole
    // Tenant row into a response the vendor dashboard and ops console render.
    const qb = this.payoutRepo
      .createQueryBuilder('payout')
      .leftJoin('payout.requestedBy', 'staff')
      .leftJoin('payout.tenant', 'tenant')
      .select('payout')
      .addSelect([
        'staff.id',
        'staff.firstName',
        'staff.lastName',
        'staff.email',
        'tenant.id',
        'tenant.name',
      ]);
    // Platform admins (no tenant) see every tenant's payouts; owners only theirs.
    if (tenantId) {
      qb.where('payout.tenantId = :tenantId', { tenantId });
    }

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

  async getPayout(
    tenantId: string | undefined,
    payoutId: string,
  ): Promise<Payout> {
    // Same column restriction as listPayouts: the relation objects used to
    // carry the staffer's password hash and the full tenant row.
    const payout = await this.payoutRepo.findOne({
      where: tenantId ? { id: payoutId, tenantId } : { id: payoutId },
      relations: { requestedBy: true, tenant: true },
      select: {
        requestedBy: { id: true, firstName: true, lastName: true, email: true },
        tenant: { id: true, name: true },
      },
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
