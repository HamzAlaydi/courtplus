import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { TenantBalance } from '../entities/tenant-balance.entity';
import { BalanceTransaction } from '../entities/balance-transaction.entity';
import { TransactionType, PayoutConstants } from '../constants/payout.constants';
import { BookingEventType } from 'src/modules/bookings/entities/event.entity';

@Injectable()
export class BalanceService {
  constructor(
    @InjectRepository(TenantBalance)
    private readonly balanceRepository: Repository<TenantBalance>,
    @InjectRepository(BalanceTransaction)
    private readonly transactionRepo: Repository<BalanceTransaction>,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  async getBalance(tenantId: string): Promise<TenantBalance> {
    let balance = await this.balanceRepository.findOne({ where: { tenantId } });

    if (!balance) {
      balance = this.balanceRepository.create({
        tenantId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        currency: PayoutConstants.DEFAULT_CURRENCY,
      });
      await this.balanceRepository.save(balance);
    }

    return balance;
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
    const balance = await this.getBalance(tenantId);

    const platformFee = Math.floor(amount * PayoutConstants.PLATFORM_FEE_PERCENTAGE);
    const netAmount = amount - platformFee;

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
    const balance = await this.getBalance(tenantId);
    const platformFee = Math.floor(amount * PayoutConstants.PLATFORM_FEE_PERCENTAGE);
    const netAmount = amount - platformFee;

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
    const balance = await this.getBalance(tenantId);

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

      balance.pendingBalance -= heldAmount;
      balance.availableBalance += heldAmount;
      balance.totalEarnings += heldAmount;
      await this.balanceRepository.save(balance);

      await this.transactionRepo.save(
        this.transactionRepo.create({
          tenantId,
          type: TransactionType.BOOKING_COMPLETED,
          amount: heldAmount,
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
    const balance = await this.getBalance(tenantId);

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
    const balance = await this.getBalance(tenantId);

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

  @OnEvent(BookingEventType.PAYMENT_COMPLETED)
  async handlePaymentCompleted(payload: {
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentId: string;
    tenantId: string;
  }) {
    await this.holdBookingRevenue(
      payload.tenantId,
      payload.bookingId,
      payload.amount,
      payload.currency,
    );
  }

  @OnEvent(BookingEventType.ENDED)
  async handleBookingEnded(payload: {
    bookingId: string;
    tenantId: string;
  }) {
    await this.releaseHeldRevenue(payload.tenantId, payload.bookingId);
  }
}
