import { Logger } from '@nestjs/common';
import { validationSchema } from 'src/config/validation';
import { TwilioService } from '../shared/services/twilio.service';
import { VerificationService } from './verification.service';
import {
  VerificationChannel,
  VerificationContext,
} from './entities/verification.entity';
import { UserType } from './@types/user.type';
import { hashPassword } from './util/password';

/**
 * TEST_PHONE_OTP_CODE lets the release APK be tested against the real server
 * with one fixed code. It has to work under NODE_ENV=production, skip the SMS,
 * and stay out of the staff/ops e-mail codes.
 */
describe('TEST_PHONE_OTP_CODE', () => {
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  jest.spyOn(Logger.prototype, 'error').mockImplementation();

  const makeConfig = (values: Record<string, string | undefined>) =>
    ({ get: (key: string) => values[key] }) as never;

  const makeTwilio = (values: Record<string, string | undefined>) =>
    new TwilioService(
      makeConfig({
        'twilio.accountSid': `AC${'0'.repeat(32)}`,
        'twilio.authToken': 'test-token',
        'twilio.serviceSid': `VA${'0'.repeat(32)}`,
        ...values,
      }),
      { get: jest.fn(), set: jest.fn(), del: jest.fn() } as never,
    );

  const invalidKeys = (env: Record<string, string>) =>
    (
      validationSchema.validate(env, { abortEarly: false }).error?.details ??
      []
    ).map((detail) => detail.path[0]);

  it('passes config validation in production', () => {
    expect(
      invalidKeys({ NODE_ENV: 'production', TEST_PHONE_OTP_CODE: '123456' }),
    ).not.toContain('TEST_PHONE_OTP_CODE');
  });

  it('must be 6 digits', () => {
    expect(invalidKeys({ TEST_PHONE_OTP_CODE: '1234' })).toContain(
      'TEST_PHONE_OTP_CODE',
    );
  });

  it('leaves DEV_OTP_BYPASS_CODE refused in production', () => {
    expect(
      invalidKeys({ NODE_ENV: 'production', DEV_OTP_BYPASS_CODE: '123456' }),
    ).toContain('DEV_OTP_BYPASS_CODE');
    expect(() =>
      makeTwilio({ env: 'production', 'auth.devOtpBypassCode': '123456' }),
    ).toThrow('Refusing to start');
  });

  it('signs in any phone number in production without sending an SMS', async () => {
    const twilio = makeTwilio({
      env: 'production',
      'auth.testPhoneOtpCode': '123456',
    });
    const create = jest.fn();
    Object.assign(twilio, { verificationService: { verifications: { create } } });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('TEST_PHONE_OTP_CODE is set'),
    );
    await twilio.sendVerificationCode('+201099900001', '127.0.0.1');
    expect(create).not.toHaveBeenCalled();
    await expect(
      twilio.checkVerificationCode('+201099900001', '123456'),
    ).resolves.toBe('approved');
  });

  it('does not approve any other code', async () => {
    const twilio = makeTwilio({
      env: 'production',
      'auth.testPhoneOtpCode': '123456',
    });
    const check = jest.fn().mockRejectedValue(new Error('not found'));
    Object.assign(twilio, {
      twilioClient: {
        verify: {
          v2: { services: () => ({ verificationChecks: { create: check } }) },
        },
      },
    });

    await expect(
      twilio.checkVerificationCode('+201099900001', '654321'),
    ).resolves.toBe('failed');
    expect(check).toHaveBeenCalled();
  });

  it('is not accepted for staff/ops e-mail codes', async () => {
    const findOne = jest.fn().mockResolvedValue({
      userId: 'staff-1',
      context: VerificationContext.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + 60_000),
      value: await hashPassword('987654'),
    });
    const service = new VerificationService(
      makeConfig({ env: 'production', 'auth.testPhoneOtpCode': '123456' }),
      {} as never,
      {} as never,
      { findOne } as never,
    );

    await expect(
      service.verifyCode({
        code: '123456',
        identifier: 'owner@example.com',
        userType: UserType.Staff,
        channel: VerificationChannel.EMAIL,
        context: VerificationContext.PASSWORD_RESET,
      }),
    ).resolves.toMatchObject({ isValid: false });
  });
});
