import { Availability } from './availability.entity';
import { dayjs } from '../../shared/dayjs';

/**
 * Regression guard for 24-hour schedules.
 *
 * `getSlots` widened the window with `if (slotEnd.isBefore(slotStart))`. For a
 * venue open around the clock the dashboard sends an equal start and end
 * (00:00-00:00), which is NOT "before", so the end never moved past the start
 * and the generator loop ran zero times. The branch looked correctly
 * configured and produced no bookable slots whatsoever.
 */
describe('Availability.getSlots', () => {
  const make = (startTime: string, endTime: string) => {
    const a = new Availability();
    a.startTime = startTime;
    a.endTime = endTime;
    a.days = [0, 1, 2, 3, 4, 5, 6];
    return a;
  };

  const day = dayjs('2026-10-01T00:00:00Z').startOf('day');

  it('generates a full day of slots for 00:00-00:00', () => {
    const slots = make('00:00', '00:00').getSlots(day, 60);
    expect(slots).toHaveLength(24);
    expect(slots[0].start.format('HH:mm')).toBe('00:00');
    expect(slots[23].end.format('HH:mm')).toBe('00:00');
  });

  it('generates a full day for an equal start/end at any hour', () => {
    // 09:00-09:00 means "open 24h, books roll over at 9am".
    const slots = make('09:00', '09:00').getSlots(day, 60);
    expect(slots).toHaveLength(24);
    expect(slots[0].start.format('HH:mm')).toBe('09:00');
  });

  it('still handles an ordinary same-day window', () => {
    const slots = make('09:00', '21:00').getSlots(day, 60);
    expect(slots).toHaveLength(12);
    expect(slots[0].start.format('HH:mm')).toBe('09:00');
    expect(slots[11].end.format('HH:mm')).toBe('21:00');
  });

  it('still handles a window that crosses midnight', () => {
    const slots = make('22:00', '02:00').getSlots(day, 60);
    expect(slots).toHaveLength(4);
    expect(slots[0].start.format('HH:mm')).toBe('22:00');
    expect(slots[3].end.format('HH:mm')).toBe('02:00');
  });

  it('drops a trailing partial slot rather than overrunning closing time', () => {
    // 09:00-10:30 with 60-minute slots: only 09:00-10:00 fits.
    const slots = make('09:00', '10:30').getSlots(day, 60);
    expect(slots).toHaveLength(1);
    expect(slots[0].end.format('HH:mm')).toBe('10:00');
  });

  it('respects the requested slot duration', () => {
    expect(make('00:00', '00:00').getSlots(day, 30)).toHaveLength(48);
    expect(make('00:00', '00:00').getSlots(day, 90)).toHaveLength(16);
  });
});
