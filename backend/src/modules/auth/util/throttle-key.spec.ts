import { normalizeEmailKey, normalizePhoneKey, authAttemptKey} from './throttle-key';

/**
 * Regression guard for the auth rate-limit bypass.
 *
 * Throttle keys were `login-email-${request.body.email}` — the RAW body value.
 * Account lookup lowercases, so one account had as many rate-limit buckets as
 * an attacker cared to invent capitalisations, giving unlimited password and
 * OTP attempts.
 */
describe('throttle key normalisation', () => {
  describe('email', () => {
    it('collapses capitalisation variants onto one bucket', () => {
      const variants = [
        'admin@courtplus.com',
        'Admin@courtplus.com',
        'ADMIN@COURTPLUS.COM',
        '  admin@courtplus.com  ',
      ].map(normalizeEmailKey);

      expect(new Set(variants).size).toBe(1);
      expect(variants[0]).toBe('admin@courtplus.com');
    });

    it('keeps genuinely different addresses apart', () => {
      expect(normalizeEmailKey('a@x.com')).not.toBe(normalizeEmailKey('b@x.com'));
    });

    it('does not throw on a missing or non-string body field', () => {
      expect(normalizeEmailKey(undefined)).toBe('unknown');
      expect(normalizeEmailKey({ $ne: null })).toBe('unknown');
    });
  });

  describe('phone', () => {
    it('collapses formatting and prefix variants onto one bucket', () => {
      const variants = [
        '+966501234567',
        '+966 50 123 4567',
        '00966501234567',
        '+966-50-123-4567',
      ].map(normalizePhoneKey);

      expect(new Set(variants).size).toBe(1);
      expect(variants[0]).toBe('966501234567');
    });

    it('keeps genuinely different numbers apart', () => {
      expect(normalizePhoneKey('+966501234567')).not.toBe(
        normalizePhoneKey('+966501234568'),
      );
    });

    it('does not throw on a missing or non-string body field', () => {
      expect(normalizePhoneKey(undefined)).toBe('unknown');
      expect(normalizePhoneKey(12345 as unknown)).toBe('unknown');
    });
  });
});

describe('authAttemptKey', () => {
  it('separates attackers from the account owner', () => {
    // Keyed on the identity alone, six requests from a stranger locked the
    // owner out for an hour.
    const victim = 'owner@venue.com';
    expect(authAttemptKey('login-email', victim, '5.5.5.5')).not.toBe(
      authAttemptKey('login-email', victim, '1.1.1.1'),
    );
  });

  it('still buckets repeat attempts from one origin together', () => {
    expect(authAttemptKey('login-email', 'a@b.com', '1.1.1.1')).toBe(
      authAttemptKey('login-email', 'a@b.com', '1.1.1.1'),
    );
  });

  it('keeps different accounts apart from the same origin', () => {
    expect(authAttemptKey('login-email', 'a@b.com', '1.1.1.1')).not.toBe(
      authAttemptKey('login-email', 'c@d.com', '1.1.1.1'),
    );
  });

  it('keeps scopes apart so a login attempt cannot exhaust password reset', () => {
    expect(authAttemptKey('login-email', 'a@b.com', '1.1.1.1')).not.toBe(
      authAttemptKey('forgot-password', 'a@b.com', '1.1.1.1'),
    );
  });

  it('still produces a usable key when the origin is unknown', () => {
    expect(authAttemptKey('login-email', 'a@b.com', undefined)).toContain(
      'unknown-ip',
    );
  });
});
