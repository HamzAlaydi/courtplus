import { Availability } from './availability.entity';
import { Schedule } from './schedule.entity';
import { dayjs } from '../../shared/dayjs';

/**
 * Working hours that cross midnight (Riyadh padel hours: 16:00-02:00).
 * The post-midnight part belongs to the NEXT calendar day; it used to be
 * ignored, so 00:00-02:00 was never bookable.
 */
describe('Schedule.checkSlotAvailability across midnight', () => {
  const schedule = new Schedule();
  schedule.timeZone = 'Asia/Riyadh';
  const a = new Availability();
  a.days = [6]; // Saturday
  a.startTime = '16:00';
  a.endTime = '02:00';
  schedule.availabilities = [a];

  // The next Saturday in Riyadh, always at least a day ahead: the entity
  // rejects any slot that starts before now, so a hard-coded date silently
  // turns these into SLOT_IN_PAST failures once it passes.
  let saturday = dayjs().tz('Asia/Riyadh').startOf('day');
  do {
    saturday = saturday.add(1, 'day');
  } while (saturday.day() !== 6);
  const sunday = saturday.add(1, 'day');
  const monday = saturday.add(2, 'day');
  const at = (day: dayjs.Dayjs, time: string) =>
    dayjs.tz(`${day.format('YYYY-MM-DD')} ${time}`, 'Asia/Riyadh');

  it('accepts a slot before midnight on the scheduled day', () => {
    const r = schedule.checkSlotAvailability(
      at(saturday, '20:00'),
      at(saturday, '21:00'),
      [],
    );
    expect(r.available).toBe(true);
  });

  it('accepts a slot after midnight that belongs to the previous day window', () => {
    const r = schedule.checkSlotAvailability(
      at(sunday, '00:30'),
      at(sunday, '01:30'),
      [],
    );
    expect(r.available).toBe(true);
  });

  it('rejects a slot after the window closes', () => {
    const r = schedule.checkSlotAvailability(
      at(sunday, '02:00'),
      at(sunday, '03:00'),
      [],
    );
    expect(r.available).toBe(false);
  });

  it('rejects the early hours on a day whose previous day has no hours', () => {
    const r = schedule.checkSlotAvailability(
      at(monday, '00:30'),
      at(monday, '01:30'),
      [],
    );
    expect(r.available).toBe(false);
  });
});

/**
 * A slot only carried "HH:mm", so the post-midnight tail of a 18:00-02:00
 * window looked like it belonged to the opening day. `date` pins down the
 * calendar day the slot actually starts on.
 */
describe('Schedule.getSlots slot dates', () => {
  const build = (startTime: string, endTime: string) => {
    const schedule = new Schedule();
    schedule.timeZone = 'Asia/Riyadh';
    const availability = new Availability();
    availability.days = [6]; // Saturday
    availability.startTime = startTime;
    availability.endTime = endTime;
    schedule.availabilities = [availability];
    return schedule;
  };

  // Midday UTC is safely inside the Riyadh (UTC+3) day it names.
  const SATURDAY = new Date('2026-10-03T12:00:00Z');
  const range = { from: SATURDAY, to: SATURDAY, duration: 60 };

  it('dates an ordinary same-day window with the opening day', () => {
    const slots = build('09:00', '12:00').getSlots([], [], range);

    expect(slots.map((s) => [s.date, s.startTime, s.endTime])).toEqual([
      ['2026-10-03', '09:00', '10:00'],
      ['2026-10-03', '10:00', '11:00'],
      ['2026-10-03', '11:00', '12:00'],
    ]);
  });

  it('dates the post-midnight part of a window with the NEXT day', () => {
    const slots = build('22:00', '02:00').getSlots([], [], range);

    expect(slots.map((s) => [s.date, s.startTime, s.endTime])).toEqual([
      ['2026-10-03', '22:00', '23:00'],
      ['2026-10-03', '23:00', '00:00'],
      ['2026-10-04', '00:00', '01:00'],
      ['2026-10-04', '01:00', '02:00'],
    ]);
  });

  it('keeps a window ending exactly at midnight on the opening day', () => {
    const slots = build('21:00', '00:00').getSlots([], [], range);

    expect(slots.map((s) => [s.date, s.startTime, s.endTime])).toEqual([
      ['2026-10-03', '21:00', '22:00'],
      ['2026-10-03', '22:00', '23:00'],
      ['2026-10-03', '23:00', '00:00'],
    ]);
  });
});
