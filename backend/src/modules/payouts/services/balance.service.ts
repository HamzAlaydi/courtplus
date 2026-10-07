import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Not, Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { TenantBalance } from '../entities/tenant-balance.entity';
import { BalanceTransaction } from '../entities/balance-transaction.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { TransactionType, PayoutConstants } from '../constants/payout.constants';
import { BookingEventType } from 'src/modules/bookings/entities/event.entity';
import type {
  BookingPaymentCompletedEventPayload,
  BookingEndedEventPayload,
  BookingPaymentRefundedEventPayload,
} from 'src/modules/bookings/bookings.events';
import { BranchesService } from 'src/modules/branches/branches.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { DistributedLockService } from 'src/common/distributed-lock.service';
import { BookingStatus } from 'src/modules/bookings/entities/booking.entity';
import { PaymentStatus } from 'src/modules/payments/entities/payment.entity';

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @InjectRepository(TenantBalance)
    private readonly balanceRepository: Repository<TenantBalance>,
    @InjectRepository(BalanceTransaction)
    private readonly transactionRepo: Repository<BalanceTransaction>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    private readonly configService: ConfigService,
    private readonly lockService: DistributedLockService,
  ) { }

  /**
   * The currency a tenant trades in: their preference (what every court and
   * booking of theirs is priced in), else the platform default.
   */
  private async tenantCurrency(tenantId: string): Promise<string> {
    try {
      const rows: Array<{ currency: string | null }> =
        await this.balanceRepository.manager.query(
          'SELECT currency FROM tenant_preferences WHERE "tenantId" = $1 LIMIT 1',
          [tenantId],
        );
      const currency = rows?.[0]?.currency;
      if (currency) return currency.toUpperCase();
    } catch (error) {
      this.logger.warn(
        `Could not read tenant ${tenantId} currency preference; using ${PayoutConstants.DEFAULT_CURRENCY}`,
      );
    }
    return PayoutConstants.DEFAULT_CURRENCY;
  }

  /**
   * Read-only balance fetch for display. Does NOT lock — never use this as the
   * basis for a write. Use getBalanceForUpdate() for anything that mutates.
   */
  async getBalance(tenantId: string): Promise<TenantBalance> {
    const balance = await this.balanceRepository.findOne({ where: { tenantId } });
    return balance ?? (await this.createBalance(tenantId));
  }

  private async createBalance(
    tenantId: string,
    currency?: string,
  ): Promise<TenantBalance> {
    // The row's currency is the tenant's own, not whatever the first caller
    // happened to pass: a display-only read (the Settings page) used to
    // create the row with a default that did not match the tenant's courts,
    // and every later booking credit was refused as a currency mismatch.
    const resolved = (currency || (await this.tenantCurrency(tenantId))).toUpperCase();
    // ON CONFLICT DO NOTHING + re-read: two concurrent first-writes would
    // otherwise each insert a row and split the tenant's money in half.
    // A unique constraint on tenantId backs this up at the DB level.
    await this.balanceRepository
      .createQueryBuilder()
      .insert()
      .into(TenantBalance)
      .values({
        tenantId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        currency: resolved,
      })
      .orIgnore()
      .execute();

    return this.balanceRepository.findOneOrFail({ where: { tenantId } });
  }

  /**
   * Fetch the balance row with SELECT ... FOR UPDATE so concurrent mutations
   * serialise on it.
   *
   * Every mutation here is read-modify-write in JS (`balance.available += x`
   * then save()), which TypeORM emits as a full UPDATE with the in-memory
   * value — NOT `SET available = available + x`. Under READ COMMITTED two
   * concurrent bookings would both read 1000, both write 1070, and one
   * payment's revenue would vanish while both ledger rows persisted, leaving
   * the balance and the transaction log permanently inconsistent.
   *
   * MUST be called inside a transaction (@Transactional) or the lock is
   * released immediately at statement end and buys nothing.
   */
  private async getBalanceForUpdate(
    tenantId: string,
    currency?: string,
  ): Promise<TenantBalance> {
    const existing = await this.balanceRepository
      .createQueryBuilder('balance')
      .setLock('pessimistic_write')
      .where('balance.tenantId = :tenantId', { tenantId })
      .getOne();

    if (existing) {
      await this.reconcileCurrency(existing, currency);
      return existing;
    }

    await this.createBalance(tenantId, currency);

    return this.balanceRepository
      .createQueryBuilder('balance')
      .setLock('pessimistic_write')
      .where('balance.tenantId = :tenantId', { tenantId })
      .getOneOrFail();
  }

  /**
   * A balance holds a single currency. Silently adding SAR to a USD-labelled
   * balance produces a number that means nothing and is then paid out in the
   * wrong currency, so a mismatch is loud rather than ignored.
   */
  private async reconcileCurrency(
    balance: TenantBalance,
    incoming?: string,
  ): Promise<void> {
    if (!incoming) return;
    const a = (balance.currency || '').toUpperCase();
    const b = incoming.toUpperCase();
    if (!a || a === b) return;

    // A balance that has never moved is only mislabelled (created by a
    // display read before the tenant priced anything). Re-label it rather
    // than refuse the tenant's first real revenue forever.
    const untouched =
      Number(balance.pendingBalance) === 0 &&
      Number(balance.availableBalance) === 0 &&
      Number(balance.totalEarnings) === 0 &&
      !(await this.transactionRepo.exists({
        where: { tenantId: balance.tenantId, amount: Not(0) },
      }));
    if (untouched) {
      this.logger.warn(
        `[BALANCE][RECONCILE] Re-labelling untouched balance of tenant ${balance.tenantId} from ${a} to ${b}`,
      );
      balance.currency = b;
      await this.balanceRepository.save(balance);
      return;
    }

    this.logger.error(
      `[BALANCE][RECONCILE] Currency mismatch for tenant ${balance.tenantId}: balance is ${a} but incoming amount is ${b}. Refusing to mix currencies.`,
    );
    throw new BadRequestException('BALANCE_CURRENCY_MISMATCH');
  }

  /**
   * Platform commission, resolved from COURT_PLUS_PERCENTAGE.
   *
   * This used to be a hardcoded PLATFORM_FEE_PERCENTAGE of 0.3 while the
   * configured (and documented) rate was 0.2 — tenants were paid 10 points
   * less than the configuration claimed, and changing the env var did nothing.
   */
  private get commissionRate(): number {
    return this.configService.get<number>('platform.commissionRate') ?? 0.2;
  }

  /**
   * Split a gross booking amount into platform fee and tenant net.
   * Rounds to minor units (2dp) rather than flooring to whole currency units,
   * which previously under-charged the fee by up to ~1 unit on every booking.
   */
  private splitAmount(amount: number): { platformFee: number; netAmount: number } {
    const platformFee = Math.round(amount * this.commissionRate * 100) / 100;
    const netAmount = Math.round((amount - platformFee) * 100) / 100;
    return { platformFee, netAmount };
  }

  async saveBalance(balance: TenantBalance): Promise<TenantBalance> {
    return this.balanceRepository.save(balance);
  }

  @Transactional()
  async addBookingRevenue(
    tenantId: string,
    bookingId: string,
    amount: number,
    currency: string,
    paymentId: string,
  ): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId, currency);

    const { platformFee, netAmount } = this.splitAmount(amount);

    balance.availableBalance += netAmount;
    balance.totalEarnings += netAmount;
    await this.balanceRepository.save(balance);

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.BOOKING_COMPLETED,
        amount: netAmount,
        currency,
        bookingId,
        paymentId,
      }),
    );

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.PLATFORM_FEE,
        amount: -platformFee,
        currency,
        bookingId,

      }),
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('balance.updated', { tenantId, balance });
    });
  }

  @Transactional()
  async holdBookingRevenue(
    tenantId: string,
    bookingId: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId, currency);
    const { platformFee, netAmount } = this.splitAmount(amount);

    balance.pendingBalance += netAmount;
    await this.balanceRepository.save(balance);

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.BOOKING_COMPLETED,
        amount: 0,
        currency,
        bookingId,
        metadata: { held: true, heldAmount: netAmount },
      }),
    );
  }

  @Transactional()
  async releaseHeldRevenue(tenantId: string, bookingId: string): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId);

    const heldTx = await this.transactionRepo.findOne({
      where: {
        tenantId,
        bookingId,
        type: TransactionType.BOOKING_COMPLETED,
      },
      order: { createdAt: 'DESC' },
    });

    if (heldTx?.metadata?.held) {
      const heldAmount = heldTx.metadata.heldAmount;

      // Release only what is STILL held. A refund before the booking ended
      // already took its share out of pendingBalance, so releasing the full
      // original hold handed the vendor money that had been given back to the
      // customer and drove pendingBalance negative.
      const reversedTotal = await this.reversedTotalForBooking(
        tenantId,
        bookingId,
      );
      const releasable = Math.max(
        0,
        Math.round((heldAmount - reversedTotal) * 100) / 100,
      );

      if (releasable <= 0) {
        this.logger.log(
          `Nothing left to release for booking ${bookingId}: held ${heldAmount}, already reversed ${reversedTotal}.`,
        );
        return;
      }

      balance.pendingBalance -= releasable;
      balance.availableBalance += releasable;
      balance.totalEarnings += releasable;
      await this.balanceRepository.save(balance);

      await this.transactionRepo.save(
        this.transactionRepo.create({
          tenantId,
          type: TransactionType.BOOKING_COMPLETED,
          amount: releasable,
          currency: balance.currency,
          bookingId,
        }),
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit('balance.updated', { tenantId, balance });
      });
    }
  }

  @Transactional()
  async deductPayout(
    tenantId: string,
    payoutId: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId);

    if (balance.availableBalance < amount) {
      throw new BadRequestException('INSUFFICIENT_BALANCE');
    }

    balance.availableBalance -= amount;
    await this.balanceRepository.save(balance);

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.PAYOUT_REQUESTED,
        amount: -amount,
        currency,
        payoutId,
      }),
    );
  }

  @Transactional()
  async refundFailedPayout(
    tenantId: string,
    payoutId: string,
    amount: number,
    currency: string,
  ): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId);

    balance.availableBalance += amount;
    await this.balanceRepository.save(balance);

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.PAYOUT_FAILED,
        amount: amount,
        currency,
        payoutId,
      }),
    );
  }

  async getTransactions(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: BalanceTransaction[]; totalCount: number }> {
    const [data, totalCount] = await this.transactionRepo.findAndCount({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, totalCount };
  }

  /**
   * Reverse a tenant's credit when a booking is refunded.
   *
   * This did not exist. TransactionType.BOOKING_REFUNDED was declared and never
   * used, and all four refund call sites in BookingsService refunded the
   * customer through Stripe without ever touching the tenant balance. The
   * tenant kept the revenue, the customer got their money back, and Court+
   * absorbed the entire refund — and the tenant could then withdraw it.
   *
   * Debits pendingBalance first (booking refunded before it ended, so the
   * revenue is still held) and only then availableBalance. Allows the balance
   * to go negative rather than silently under-reversing: a negative balance is
   * a visible debt that blocks payouts, whereas a partial reversal is an
   * invisible loss.
   */
  @Transactional()
  /**
   * Total the vendor was ever credited for a booking: the held amount if a
   * hold marker exists, otherwise nothing. Release moves money between
   * buckets, so it must not be counted a second time.
   */
  private async creditedTotalForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<number> {
    const rows = await this.transactionRepo.find({
      where: { tenantId, bookingId, type: TransactionType.BOOKING_COMPLETED },
      order: { createdAt: 'ASC' },
    });
    const holdMarker = rows.find((r) => r.metadata?.held);
    if (holdMarker) {
      return Number(holdMarker.metadata.heldAmount) || 0;
    }
    // No hold marker: credits were booked directly (non-split path).
    return rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  /** Total already reversed for a booking, as a positive number. */
  private async reversedTotalForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<number> {
    const rows = await this.transactionRepo.find({
      where: { tenantId, bookingId, type: TransactionType.BOOKING_REFUNDED },
    });
    const total = rows.reduce(
      (sum, r) => sum + Math.abs(Number(r.amount) || 0),
      0,
    );
    return Math.round(total * 100) / 100;
  }

  async reverseBookingRevenue(
    tenantId: string,
    bookingId: string,
    refundedAmount: number,
    currency: string,
    paymentId?: string,
  ): Promise<void> {
    const balance = await this.getBalanceForUpdate(tenantId, currency);

    // Reverse the tenant's share only — the platform fee is reversed implicitly
    // because it was never credited to the tenant in the first place.
    const { netAmount } = this.splitAmount(refundedAmount);

    // Dedupe per PAYMENT when we know it. A split booking has one payment per
    // participant; keyed on bookingId alone, refunding the second participant
    // was skipped as a "duplicate" of the first and the vendor kept their
    // share of money the customer got back.
    const alreadyReversed = await this.transactionRepo.findOne({
      where: {
        tenantId,
        bookingId,
        type: TransactionType.BOOKING_REFUNDED,
        ...(paymentId ? { paymentId } : {}),
      },
    });
    if (alreadyReversed) {
      this.logger.warn(
        `Skipping duplicate revenue reversal for bookingId: ${bookingId}${paymentId ? `, paymentId: ${paymentId}` : ''}`,
      );
      return;
    }

    // Never take back more than this booking ever credited. A split booking
    // that has not settled yet has no hold at all, so refunding a participant
    // used to debit the vendor for revenue they were never given — pushing
    // the balance negative for a venue that had earned nothing.
    const creditedForBooking = await this.creditedTotalForBooking(
      tenantId,
      bookingId,
    );
    const reversedSoFar = await this.reversedTotalForBooking(
      tenantId,
      bookingId,
    );
    const reversible = Math.max(
      0,
      Math.round((creditedForBooking - reversedSoFar) * 100) / 100,
    );
    const effectiveNet = Math.min(netAmount, reversible);

    if (effectiveNet < netAmount) {
      this.logger.warn(
        `Capping revenue reversal for booking ${bookingId}: refund share ${netAmount}, but only ${reversible} was ever credited to tenant ${tenantId}.`,
      );
    }

    const fromPending = Math.min(balance.pendingBalance, effectiveNet);
    const fromAvailable = Math.round((effectiveNet - fromPending) * 100) / 100;

    balance.pendingBalance = Math.round((balance.pendingBalance - fromPending) * 100) / 100;
    balance.availableBalance = Math.round((balance.availableBalance - fromAvailable) * 100) / 100;
    // totalEarnings only ever grows at release time (pending -> available),
    // so only the released share is earnings to take back. Subtracting the
    // whole net amount for a refund of still-pending revenue drove lifetime
    // earnings negative for a vendor who had never earned anything.
    balance.totalEarnings = Math.round((balance.totalEarnings - fromAvailable) * 100) / 100;
    await this.balanceRepository.save(balance);

    await this.transactionRepo.save(
      this.transactionRepo.create({
        tenantId,
        type: TransactionType.BOOKING_REFUNDED,
        amount: -effectiveNet,
        currency,
        bookingId,
        paymentId: paymentId ?? null,
      }),
    );

    if (balance.availableBalance < 0) {
      this.logger.warn(
        `Tenant ${tenantId} balance is negative (${balance.availableBalance}) after refunding booking ${bookingId} — revenue was already paid out.`,
      );
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit('balance.updated', { tenantId, balance });
    });
  }

  @OnEvent(BookingEventType.PAYMENT_COMPLETED)
  async handlePaymentCompleted({
    booking,
  }: BookingPaymentCompletedEventPayload) {
    try {
      const tenantId = await this.branchesService.getTenantIdFromCourtId(
        booking.courtId,
      );
      const amount = Number(booking.totalAmount);

      if (!tenantId || !booking.id || !Number.isFinite(amount) || amount <= 0) {
        this.logger.warn(
          `Skipping holdBookingRevenue - unresolvable payload: bookingId: ${booking?.id}, tenantId: ${tenantId}, amount: ${booking?.totalAmount}`,
        );
        return;
      }

      // Walk-in bookings entered by the vendor's staff are marked paid but no
      // money passed through Court+ — the vendor collected it directly.
      // Crediting them here created a withdrawable balance out of thin air.
      if (booking.staffId) {
        return;
      }

      await this.holdBookingRevenue(
        tenantId,
        booking.id,
        amount,
        booking.currency || PayoutConstants.DEFAULT_CURRENCY,
      );
    } catch (error) {
      this.logger.error('Failed to hold booking revenue', error);
    }
  }


  /**
   * Safety net for the revenue hold above, which rides an in-process event:
   * any failure there (the currency mismatch that used to be thrown, a crash
   * between the payment and the handler) left a paid booking with no ledger
   * row and the vendor short of the money. Every hour — and once shortly
   * after boot — paid, non-cancelled customer bookings of the last 30 days
   * with no hold row get one.
   */
  @Timeout(20_000)
  @Cron(CronExpression.EVERY_HOUR)
  async reconcileMissingHolds(): Promise<void> {
    await this.lockService.runExclusively(
      'balance:reconcile-holds',
      10 * 60 * 1000,
      async () => {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const missing = await this.bookingRepo
          .createQueryBuilder('b')
          .leftJoin(
            BalanceTransaction,
            't',
            't."bookingId" = b.id AND t.type = :held',
            { held: TransactionType.BOOKING_COMPLETED },
          )
          .where('b."paymentStatus" = :paid', { paid: PaymentStatus.COMPLETED })
          .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
          .andWhere('b."staffId" IS NULL')
          .andWhere('b."createdAt" > :since', { since })
          .andWhere('t.id IS NULL')
          .select(['b.id', 'b.courtId', 'b.totalAmount', 'b.currency'])
          .getMany();

        let held = 0;
        for (const booking of missing) {
          try {
            const tenantId = await this.branchesService.getTenantIdFromCourtId(
              booking.courtId,
            );
            const amount = Number(booking.totalAmount);
            if (!tenantId || !Number.isFinite(amount) || amount <= 0) continue;
            await this.holdBookingRevenue(
              tenantId,
              booking.id,
              amount,
              booking.currency || PayoutConstants.DEFAULT_CURRENCY,
            );
            held++;
          } catch (error) {
            this.logger.error(
              `[BALANCE][RECONCILE] Could not hold revenue for booking ${booking.id}`,
              error as Error,
            );
          }
        }
        if (missing.length) {
          this.logger.warn(
            `[BALANCE][RECONCILE] ${held}/${missing.length} paid bookings were missing a revenue hold and have been credited`,
          );
        }
      },
    );
  }

  /**
   * Debit the tenant when a customer is refunded.
   *
   * Without this the refund path credited the customer and left the tenant's
   * credit intact, so Court+ paid for every refund out of its own pocket.
   */
  @OnEvent(BookingEventType.PAYMENT_REFUNDED)
  async handlePaymentRefunded({
    bookingId,
    paymentId,
    amount,
    currency,
  }: BookingPaymentRefundedEventPayload) {
    try {
      if (!bookingId) {
        this.logger.warn(
          `[BALANCE] Cannot reverse revenue - refund has no bookingId, paymentId: ${paymentId}`,
        );
        return;
      }

      const booking = await this.bookingRepo.findOne({
        where: { id: bookingId },
        select: { id: true, courtId: true },
      });
      const tenantId = booking?.courtId
        ? await this.branchesService.getTenantIdFromCourtId(booking.courtId)
        : undefined;

      const value = Number(amount);
      if (!tenantId || !Number.isFinite(value) || value <= 0) {
        this.logger.error(
          `[BALANCE] Cannot reverse revenue - unresolvable payload. bookingId: ${bookingId}, tenantId: ${tenantId}, amount: ${amount}`,
        );
        return;
      }

      await this.reverseBookingRevenue(
        tenantId,
        bookingId,
        value,
        currency || PayoutConstants.DEFAULT_CURRENCY,
        paymentId,
      );
    } catch (error) {
      // Money correctness: a swallowed failure here means Court+ silently eats
      // the refund. Logged at error with a greppable marker so it can be
      // alerted on and reconciled. A durable queue is the proper fix.
      this.logger.error(
        `[BALANCE][RECONCILE] Failed to reverse tenant revenue for refunded booking ${bookingId} (paymentId ${paymentId}) — tenant balance is now overstated by roughly ${amount}.`,
        error as Error,
      );
    }
  }

  @OnEvent(BookingEventType.ENDED)
  async handleBookingEnded({ booking }: BookingEndedEventPayload) {
    try {
      const tenantId = await this.branchesService.getTenantIdFromCourtId(
        booking.courtId,
      );

      if (!tenantId || !booking.id) {
        this.logger.warn(
          `Skipping releaseHeldRevenue - unresolvable payload: bookingId: ${booking?.id}, tenantId: ${tenantId}`,
        );
        return;
      }

      await this.releaseHeldRevenue(tenantId, booking.id);
    } catch (error) {
      this.logger.error('Failed to release held booking revenue', error);
    }
  }
}
