import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PHONE_NUMBER_NOT_VERIFIED } from '../error-codes';
import { ServiceContext } from 'twilio/lib/rest/verify/v2/service';
import { ServiceUnavailableException } from '@nestjs/common';
import { SMS_SEND_FAILED } from 'src/modules/shared/error-codes';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class TwilioService {
  private readonly twilioClient: Twilio;
  private readonly env: string;
  private readonly verificationService: ServiceContext;
  private readonly otpBypassCode?: string;
  // Env var otpBypassCode came from, so every log line names the switch.
  private readonly otpBypassSource: string;
  private readonly logger = new Logger(TwilioService.name);
  constructor(
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.twilioClient = new Twilio(
      configService.get('twilio.accountSid'),
      configService.get('twilio.authToken'),
    );
    this.env = configService.get('env');

    // Fail fast rather than silently ignoring the flag: if someone ships a
    // production image with the bypass set, refuse to boot instead of serving
    // an authentication bypass for every phone number on the platform.
    const bypass = configService.get<string>('auth.devOtpBypassCode');
    if (bypass && this.env === 'production') {
      throw new Error(
        'DEV_OTP_BYPASS_CODE is set while NODE_ENV=production. Refusing to start: this would let any caller sign in as any phone number.',
      );
    }
    // Pre-launch testing on the real server: TEST_PHONE_OTP_CODE is allowed in
    // production so the release APK can be tried without verifying every
    // tester's number in the Twilio trial console.
    const testCode = configService.get<string>('auth.testPhoneOtpCode');
    this.otpBypassCode = bypass || testCode || undefined;
    this.otpBypassSource = bypass ? 'DEV_OTP_BYPASS_CODE' : 'TEST_PHONE_OTP_CODE';
    if (testCode) {
      this.logger.warn(
        'TEST_PHONE_OTP_CODE is set: no SMS is sent and every phone number signs in with that code. Remove it before real customers sign up.',
      );
    }
    this.verificationService = this.twilioClient.verify.v2.services(
      this.configService.get('twilio.serviceSid'),
    );
  }

  async sendVerificationCode(phoneNumber: string, deviceIp: string) {
    // Twilio trial accounts can only message numbers verified in the Twilio
    // console, so without this the whole sign-in flow is untestable for any
    // other number. Skips the SMS only while DEV_OTP_BYPASS_CODE (local) or
    // TEST_PHONE_OTP_CODE (pre-launch testing) is set.
    if (this.otpBypassCode) {
      this.logger.warn(
        `Skipping Twilio send for ${phoneNumber} — ${this.otpBypassSource} is set. Use code ${this.otpBypassCode}.`,
      );
      return;
    }

    await this.invalidateVerification(phoneNumber);

    try {
      const verification =
        await this.verificationService.verifications.create({
          to: phoneNumber,
          channel: 'sms',
          deviceIp: this.env !== 'development' ? deviceIp : undefined,
        });
      await this.cacheManager.set(
        `verification-sid#${phoneNumber}`,
        verification.sid,
      );
      return verification;
    } catch (error: any) {
      // Twilio trial accounts can only message verified numbers; surface a
      // clear client error instead of a raw 500.
      if (
        typeof error?.message === 'string' &&
        error.message.includes('unverified')
      ) {
        throw new BadRequestException(PHONE_NUMBER_NOT_VERIFIED);
      }
      this.logger.warn(`Twilio sendVerificationCode failed: ${error?.message}`);
      throw new ServiceUnavailableException(SMS_SEND_FAILED);
    }
  }

  async checkVerificationCode(phoneNumber: string, code: string) {
    try {
      // Fixed-code bypass. Gated on an explicit opt-in flag rather than on
      // NODE_ENV so that a mistyped NODE_ENV can never turn a fixed code into a
      // universal login: DEV_OTP_BYPASS_CODE (refused in production) or
      // TEST_PHONE_OTP_CODE (pre-launch testing on the real server).
      if (this.otpBypassCode && code === this.otpBypassCode) {
        this.logger.warn(
          `OTP bypass code accepted for ${phoneNumber} — ${this.otpBypassSource} is set.`,
        );
        return 'approved';
      }
      const verification = await this.twilioClient.verify.v2
        .services(this.configService.get('twilio.serviceSid'))
        .verificationChecks.create({ to: phoneNumber, code });

      return verification.status;
    } catch (error) {
      this.logger.error(error);
      return 'failed';
    }
  }

  private async invalidateVerification(phoneNumber: string) {
    const verificationSid: string = await this.cacheManager.get(
      `verification-sid#${phoneNumber}`,
    );
    if (verificationSid) {
      try {
        await this.verificationService.verifications(verificationSid).update({
          status: 'canceled',
        });
      } catch (error) {
        this.logger.error(error);
      } finally {
        await this.cacheManager.del(`verification-sid#${phoneNumber}`);
      }
    }
  }
}
