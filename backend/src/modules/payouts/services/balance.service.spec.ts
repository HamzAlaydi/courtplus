import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BalanceService } from './balance.service';
import { TenantBalance } from '../entities/tenant-balance.entity';
import { BalanceTransaction } from '../entities/balance-transaction.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { BranchesService } from 'src/modules/branches/branches.service';
import { TransactionType } from '../constants/payout.constants';
import { DistributedLockService } from 'src/common/distributed-lock.service';

jest.mock('typeorm-transactional', () => ({
  Transactional: () => () => undefined,
  runOnTransactionCommit: (cb: () => void) => cb(),
}));

/**
 * Regression coverage for the tenant ledger.
 *
 * None of this was tested. The defects these lock down were all live:
 *  - the commission was hardcoded to 30% while config said 20%,
 *  - the fee was floored to whole currency units, dropping cents,
 *  - refunds never debited the tenant, so Court+ absorbed every refund,
 *  - balance mutations read-modify-wrote with no row lock.
 */
describe('BalanceService', () => {
  let service: BalanceService;
  let balanceRepo: any;
  let transactionRepo: any;
  let lockedQueryBuilder: any;

  const TENANT = 'tenant-1';

  const makeBalance = (over: Partial<TenantBalance> = {}): TenantBalance =>
    ({
      id: 'bal-1',
      tenantId: TENANT,
      availableBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      currency: 'SAR',
      ...over,
    }) as TenantBalance;

  beforeEach(async () => {
    lockedQueryBuilder = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getOneOrFail: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orIgnore: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({}),
    };

    balanceRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn((b) => Promise.resolve(b)),
      createQueryBuilder: jest.fn(() => lockedQueryBuilder),
      // tenant currency lookup (no preferences row in these tests)
      manager: { query: jest.fn().mockResolvedValue([]) },
    };
    transactionRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      exists: jest.fn().mockResolvedValue(false),
      save: jest.fn((t) => Promise.resolve(t)),
      create: jest.fn((t) => t),
      // Reversal is capped at what the booking actually credited, so the
      // ledger has to be modelled. Default: the full 100 was credited and
      // nothing reversed yet.
      find: jest.fn(({ where }: any) =>
        Promise.resolve(
          where?.type === TransactionType.BOOKING_COMPLETED
            ? [{ amount: 100, metadata: null }]
            : [],
        ),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        { provide: getRepositoryToken(TenantBalance), useValue: balanceRepo },
        { provide: getRepositoryToken(BalanceTransaction), useValue: transactionRepo },
        { provide: getRepositoryToken(Booking), useValue: { findOne: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: BranchesService, useValue: { getTenantIdFromCourtId: jest.fn() } },
        {
          provide: DistributedLockService,
          useValue: { runExclusively: jest.fn((_k, _ttl, task) => task()) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(0.2) },
        },
      ],
    }).compile();

    service = module.get<BalanceService>(BalanceService);
  });

  describe('commission', () => {
    it('applies the configured 20% rate, not the old hardcoded 30%', async () => {
      const balance = makeBalance();
      lockedQueryBuilder.getOne.mockResolvedValue(balance);

      await service.addBookingRevenue(TENANT, 'b1', 100, 'SAR', 'p1');

      // 20% fee -> tenant keeps 80. Under the old constant this was 70.
      expect(balance.availableBalance).toBe(80);
      expect(balance.totalEarnings).toBe(80);
    });

    it('keeps cents instead of flooring the fee to whole currency units', async () => {
      const balance = makeBalance();
      lockedQueryBuilder.getOne.mockResolvedValue(balance);

      await service.addBookingRevenue(TENANT, 'b1', 33.5, 'SAR', 'p1');

      // 20% of 33.50 is exactly 6.70. Math.floor() previously produced 6,
      // quietly under-charging the platform fee on every booking.
      expect(balance.availableBalance).toBe(26.8);
    });

    it('records the platform fee as a negative ledger entry', async () => {
      lockedQueryBuilder.getOne.mockResolvedValue(makeBalance());

      await service.addBookingRevenue(TENANT, 'b1', 100, 'SAR', 'p1');

      expect(transactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: TransactionType.PLATFORM_FEE, amount: -20 }),
      );
    });
  });

  describe('locking', () => {
    it('takes a row lock before mutating the balance', async () => {
      lockedQueryBuilder.getOne.mockResolvedValue(makeBalance());

      await service.addBookingRevenue(TENANT, 'b1', 100, 'SAR', 'p1');

      // Without FOR UPDATE, two concurrent bookings both read the old balance
      // and the second save() silently discards the first one's revenue.
      expect(lockedQueryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
    });

    it('does not use the unlocked read path for writes', async () => {
      lockedQueryBuilder.getOne.mockResolvedValue(makeBalance());

      await service.addBookingRevenue(TENANT, 'b1', 100, 'SAR', 'p1');

      expect(balanceRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('reverseBookingRevenue', () => {
    it('debits pending first when the booking had not yet ended', async () => {
      const balance = makeBalance({ pendingBalance: 80, availableBalance: 500 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(balance.pendingBalance).toBe(0);
      expect(balance.availableBalance).toBe(500);
    });

    it('falls through to available balance once revenue has been released', async () => {
      const balance = makeBalance({ pendingBalance: 0, availableBalance: 500 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(balance.availableBalance).toBe(420);
      expect(balance.totalEarnings).toBe(-80);
    });

    it('writes a BOOKING_REFUNDED ledger entry', async () => {
      lockedQueryBuilder.getOne.mockResolvedValue(makeBalance({ availableBalance: 500 }));

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(transactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.BOOKING_REFUNDED,
          amount: -80,
          bookingId: 'b1',
        }),
      );
    });

    it('is idempotent — a replayed refund does not double-debit', async () => {
      const balance = makeBalance({ availableBalance: 500 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);
      transactionRepo.findOne.mockResolvedValue({ id: 'already-reversed' });

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(balance.availableBalance).toBe(500);
      expect(transactionRepo.save).not.toHaveBeenCalled();
    });

    it('refuses to debit a booking that never credited the vendor', async () => {
      // Unsettled split booking: participants have paid, but the vendor is
      // only credited once the booking completes. Refunding a participant
      // used to take money the venue had never been given.
      const balance = makeBalance({ availableBalance: 10, pendingBalance: 0 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);
      transactionRepo.find.mockResolvedValue([]);

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(balance.availableBalance).toBe(10);
      expect(balance.pendingBalance).toBe(0);
      expect(transactionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ amount: -0 }),
      );
    });

    it('never reverses more than the booking credited, across repeat refunds', async () => {
      const balance = makeBalance({ availableBalance: 500, pendingBalance: 0 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);
      transactionRepo.find.mockImplementation(({ where }: any) =>
        Promise.resolve(
          where?.type === TransactionType.BOOKING_COMPLETED
            ? [{ amount: 80, metadata: null }]
            : [{ amount: -50 }],
        ),
      );

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      // 80 credited, 50 already reversed -> only 30 may still be taken back.
      expect(balance.availableBalance).toBe(470);
    });

    it('allows a negative balance rather than silently under-reversing', async () => {
      // Revenue already paid out: the debt must stay visible, because a
      // partial reversal is an invisible loss for the platform.
      const balance = makeBalance({ availableBalance: 10, pendingBalance: 0 });
      lockedQueryBuilder.getOne.mockResolvedValue(balance);

      await service.reverseBookingRevenue(TENANT, 'b1', 100, 'SAR');

      expect(balance.availableBalance).toBe(-70);
    });
  });
});
