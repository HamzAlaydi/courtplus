import { Transform } from 'class-transformer';
import { parsePhoneNumberWithError } from 'libphonenumber-js/max';

/**
 * Normalise a phone number to E.164 before validation and lookup.
 *
 * Sign-up stored numbers as E.164, but send-code and login looked users up
 * by the raw string the app sent — so "+2001012345678" (Egyptian number
 * typed with its trunk 0, the common case) registered fine and could never
 * log in again. Every phone-carrying DTO now goes through this, so one
 * spelling reaches the database and the throttle keys.
 */
export function NormalizePhone(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return parsePhoneNumberWithError(value.trim()).format('E.164');
    } catch {
      return value.trim();
    }
  });
}
