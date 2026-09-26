import { StatsService } from './stats.service';

/**
 * "Revenue - last 30 days" showed 900 SAR on a tenant that had actually
 * taken 1,400, and filed it under the wrong day. The chart grouped on
 * `booking.startDate` - the day the match is played - and then clipped the
 * range at today, so every payment captured for a FUTURE booking disappeared.
 */
describe('StatsService revenue and bookings charts', () => {
  const makeService = (rows: any[]) => {
    const qb: any = {};
    for (const m of [
      'createQueryBuilder',
      'innerJoin',
      'leftJoin',
      'select',
      'where',
      'andWhere',
      'setParameter',
      'groupBy',
      'orderBy',
    ]) {
      qb[m] = jest.fn().mockReturnValue(qb);
    }
    qb.getRawMany = jest.fn().mockResolvedValue(rows);
    const service = Object.create(StatsService.prototype) as any;
    Object.assign(service, { bookingsRepository: { createQueryBuilder: () => qb } });
    return { service, qb };
  };

  // Local midnights, not UTC instants: the SQL buckets with DATE(), which
  // resolves in the database session's timezone, and the axis has to line up
  // with it. Writing these as '...T23:59:59Z' made the test itself
  // timezone-dependent — east of UTC it rolls into the next local day.
  const start = new Date(2026, 8, 24);
  const end = new Date(2026, 8, 26);

  it('buckets revenue by when the payment was captured, not the match date', async () => {
    const { service, qb } = makeService([]);
    await service.getRevenueChart(['court-1'], start, end);

    const grouped = qb.groupBy.mock.calls.flat().join(' ');
    expect(grouped).toContain('payment."createdAt"');
    expect(grouped).not.toContain('startDate');

    // The range must clip on the payment too, or future bookings vanish again.
    const wheres = qb.andWhere.mock.calls.map((c: any[]) => c[0]).join(' ');
    expect(wheres).toContain('payment."createdAt" >=');
    expect(wheres).toContain('payment."createdAt" <=');
  });

  it('counts only captured payments, so a refund drops out on its own', async () => {
    const { service, qb } = makeService([]);
    await service.getRevenueChart(['court-1'], start, end);
    // An inner join: a booking with no settled payment contributes nothing
    // rather than a zero row.
    expect(qb.innerJoin).toHaveBeenCalled();
    const params = qb.setParameter.mock.calls.flat();
    expect(params).toContain('completed');
  });

  it('returns one point per day so a single active day still draws a line', async () => {
    const { service } = makeService([
      { date: '2026-09-25T00:00:00', revenue: '1150.00' },
    ]);
    const { points } = await service.getRevenueChart(['court-1'], start, end);

    expect(points).toEqual([
      { x: '2026-09-24', y: 0 },
      { x: '2026-09-25', y: 1150 },
      { x: '2026-09-26', y: 0 },
    ]);
  });

  it('excludes cancelled bookings from the bookings chart', async () => {
    const { service, qb } = makeService([]);
    await service.getTotalBookingsChart(['court-1'], start, end);

    const wheres = qb.andWhere.mock.calls.map((c: any[]) => c[0]).join(' ');
    // It used to count them, so a day where every booking was cancelled still
    // showed bars next to a revenue chart correctly reading zero.
    expect(wheres).toContain('booking.status != :cancelled');
    // And it groups on creation, matching the revenue chart's question.
    expect(qb.groupBy.mock.calls.flat().join(' ')).toContain('booking.createdAt');
  });

  it('pads the bookings chart across the range as well', async () => {
    const { service } = makeService([{ date: '2026-09-26T00:00:00', count: '2' }]);
    const { points } = await service.getTotalBookingsChart(['c'], start, end);
    expect(points.map((p: any) => p.y)).toEqual([0, 0, 2]);
  });

  it('does not loop forever on an inverted range', async () => {
    const { service } = makeService([]);
    const { points } = await service.getRevenueChart(
      ['c'],
      new Date(2026, 8, 26),
      new Date(2026, 8, 24),
    );
    expect(points).toEqual([]);
  });
});
