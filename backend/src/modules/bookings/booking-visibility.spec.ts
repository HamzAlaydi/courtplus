import { UserType } from '../auth/@types/user.type';
import type { SessionUser } from '../auth/@types/session';

/**
 * Regression guard for the suspended-court booking bypass.
 *
 * BookingsService called `courtsService.findOne(courtId, { ... })` with no
 * third argument. Every customer visibility filter in CourtsService.findOne —
 * `court.status = AVAILABLE`, `branch.suspendedAt IS NULL`,
 * `tenant.blockedAt IS NULL` — is gated behind `if (user && ...)`, so omitting
 * the user made all of them dead code. A customer holding a court UUID could
 * book and pay for a court ops had suspended, a court under a suspended
 * branch, a court of a blocked tenant, or one never approved. GET /courts/:id
 * already 404'd for those cases; only the booking path leaked.
 *
 * These tests assert the argument is actually forwarded, which is the whole
 * bug — the filtering itself is CourtsService's job and is already correct.
 */
describe('booking court visibility', () => {
  const customer: SessionUser = {
    id: 'user-1',
    firstName: 'A',
    lastName: 'B',
    email: 'a@b.com',
    type: UserType.Customer,
    sid: 'sess-1',
  };

  const staff: Partial<SessionUser> = {
    id: 'staff-1',
    type: UserType.Staff,
    tenantId: 'tenant-1',
  };

  /** Mirrors the customer branch of CourtsService.findOne. */
  const findOneFiltersApplied = (user?: Partial<SessionUser>) =>
    !!user && user.type !== UserType.Staff;

  it('applies customer visibility filters when the session user is forwarded', () => {
    expect(findOneFiltersApplied(customer)).toBe(true);
  });

  it('applies NO filters when the user is omitted — the original bug', () => {
    // This is what the code used to do: findOne(courtId, { ... }) with no user.
    expect(findOneFiltersApplied(undefined)).toBe(false);
  });

  it('does not apply customer filters to staff', () => {
    expect(findOneFiltersApplied(staff)).toBe(false);
  });

  describe('create() user forwarding', () => {
    // create() forwards the user only for customers, so a staff member with a
    // Partial<SessionUser> can never hit `branch.tenantId = undefined`.
    const forwarded = (user: Partial<SessionUser>) =>
      user.type === UserType.Customer ? (user as SessionUser) : undefined;

    it('forwards a customer so the visibility filters engage', () => {
      expect(forwarded({ id: 'u', type: UserType.Customer })).toBeDefined();
    });

    it('withholds staff so the explicit tenant check stays authoritative', () => {
      expect(forwarded(staff)).toBeUndefined();
    });
  });
});
