import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
export { dayjs };

const OFFSET_PATTERN = /([+-]\d{2}:?\d{2}|Z)$/i;

/**
 * Single booking-time convention:
 *  - naive client timestamps (e.g. "2026-07-27 09:00") are WALL TIMES in the
 *    court's schedule timezone and are converted to UTC for storage
 *    (Postgres naive timestamp columns hold UTC);
 *  - offset-bearing timestamps (ISO offsets or "Z") are absolute instants
 *    and are used as-is (note: dayjs.tz() must NOT be used for those — it
 *    double-applies the zone shift).
 */
export const parseBookingDateTime = (
  value: string,
  scheduleTimeZone: string,
): Date => {
  const trimmed = value.trim();
  if (OFFSET_PATTERN.test(trimmed)) {
    return dayjs(trimmed).toDate();
  }
  return dayjs.tz(trimmed, scheduleTimeZone || 'UTC').toDate();
};
