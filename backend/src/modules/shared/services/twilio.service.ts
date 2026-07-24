import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ServiceContext } from 'twilio/lib/rest/verify/v2/service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class TwilioService {
  private readonly twilioClient: Twilio;
  private readonly env: string;
  private readonly verificationService: ServiceContext;
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
    this.verificationService = this.twilioClient.verify.v2.services(
      this.configService.get('twilio.serviceSid'),
    );
  }

  async sendVerificationCode(phoneNumber: string, deviceIp: string) {
    await this.invalidateVerification(phoneNumber);

    const verification = await this.verificationService.verifications.create({
      to: phoneNumber,
      channel: 'sms',
      deviceIp: this.env !== 'development' ? deviceIp : undefined,
    });
    await this.cacheManager.set(
      `verification-sid#${phoneNumber}`,
      verification.sid,
    );
    return verification;
  }

  async checkVerificationCode(phoneNumber: string, code: string) {
    try {
      if (['development', 'dev'].includes(this.env)) {
        if (code === '123456') {
          return 'approved';
        }
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
