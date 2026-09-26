import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from '../shared/services/twilio.service';
import { EmailService, EmailTemplate } from '../shared/services/email.service';
import { VERIFICATION_CODE_TTL_MINUTES } from './verification.constants';
import { verifyPassword, hashPassword } from './util/password';
import { createRandomStringGenerator } from '@better-auth/utils/random';
import {
  VerificationChannel,
  Verification,
  VerificationContext,
} from './entities/verification.entity';
import { UserType } from './@types/user.type';
import { Staffer } from '../staff/entities/staff.entity';
import { CODE_EXPIRED, INVALID_CODE } from 'src/modules/shared/error-codes';
import { User } from '../users/entities/user.entity';
import { dayjs } from '../shared/dayjs';

@Injectable()
export class VerificationService {
  private otpGenerator: (length: number) => string;
  private env: string;
  /**
   * Local-only bypass code, taken from DEV_OTP_BYPASS_CODE (Joi refuses it in
   * production). The previous hard-coded '123456' was accepted whenever
   * NODE_ENV was not 'production' — which the shipped .env.example sets to
   * 'development' — i.e. one fixed code reset any staff or ops password.
   */
  private readonly otpBypassCode?: string;
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    configService: ConfigService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
  ) {
    this.otpGenerator = createRandomStringGenerator('0-9');
    this.env = configService.get('env');
    this.otpBypassCode = configService.get<string>('auth.devOtpBypassCode') || undefined;
  }

  async createVerification({
    codeLength = 6,
    userId,
    context,
    identifier,
    channel,
  }: {
    codeLength?: number;
    userId: string;
    context: VerificationContext;
    identifier: string;
    channel: VerificationChannel;
    userType: UserType;
  }): Promise<string> {
    const { code, persist } = await this.prepareVerification({
      codeLength,
      userId,
      context,
      identifier,
      channel,
    });
    await persist();
    return code;
  }

  /**
   * Generates a code and hands back a `persist()` the caller runs only once
   * the code has actually gone out.
   *
   * The old flow upserted first and emailed second. Because the upsert
   * overwrites the row in place (conflictPaths userId+context), a resend whose
   * email then failed destroyed the code the user had already received AND
   * left them without a replacement — the one action offered to someone who
   * has not got their code could take away the code they did have.
   */
  private async prepareVerification({
    codeLength = 6,
    userId,
    context,
    identifier,
    channel,
  }: {
    codeLength?: number;
    userId: string;
    context: VerificationContext;
    identifier: string;
    channel: VerificationChannel;
  }): Promise<{ code: string; persist: () => Promise<void> }> {
    const code = this.otpGenerator(codeLength);
    const hashedCode = await hashPassword(code);

    const persist = async () => {
      await this.verificationsRepository.upsert(
        {
          value: hashedCode,
          channel,
          expiresAt: dayjs()
            .add(VERIFICATION_CODE_TTL_MINUTES, 'minutes')
            .toDate(),
          userId,
          context,
          identifier,
        },
        {
          conflictPaths: ['userId', 'context'],
        },
      );
    };

    return { code, persist };
  }

  async verifyCode({
    code,
    identifier,
    userType,
    channel,
    context,
  }: {
    context?: VerificationContext;
    identifier: string;
    channel: VerificationChannel;
    userType: UserType;
    code: string;
  }): Promise<{
    isValid: boolean;
    errorCode?: string;
    context?: VerificationContext;
    userType?: UserType;
    userId?: string;
    channel?: VerificationChannel;
  }> {
    if (channel === VerificationChannel.PHONE) {
      const status = await this.twilioService.checkVerificationCode(
        identifier,
        code,
      );
      if (status === 'approved') {
        return { isValid: true, userId: null };
      }
      if (status === 'expired') {
        return { isValid: false, errorCode: CODE_EXPIRED };
      }
      if (status === 'failed') {
        return { isValid: false, errorCode: INVALID_CODE };
      }

      return { isValid: false, errorCode: INVALID_CODE };
    }

    const verification = await this.verificationsRepository.findOne({
      where: { identifier, context },
    });
    if (!verification) {
      return { isValid: false, errorCode: INVALID_CODE };
    }

    if (dayjs(verification.expiresAt).isBefore(dayjs())) {
      return { isValid: false, errorCode: CODE_EXPIRED };
    }

    if (this.otpBypassCode && this.env !== 'production' && code === this.otpBypassCode) {
      return {
        isValid: true,
        context,
        userType,
        channel: VerificationChannel.EMAIL,
        userId: verification.userId,
      };
    }

    const isValid =
      verification.context === context &&
      (await verifyPassword({
        hash: verification.value,
        password: code,
      }));

    if (!isValid) {
      return { isValid: false, errorCode: INVALID_CODE };
    }

    return {
      isValid: true,
      context,
      userType,
      channel: VerificationChannel.EMAIL,
      userId: verification.userId,
    };
  }

  async sendVerificationEmail(
    user: Staffer | User,
    context: VerificationContext,
  ): Promise<void> {
    const { code, persist } = await this.prepareVerification({
      userId: user.id,
      context,
      identifier: user.email,
      channel: VerificationChannel.EMAIL,
    });
    let template: EmailTemplate;
    switch (context) {
      case VerificationContext.ACCOUNT_VERIFICATION:
        template = EmailTemplate.AccountVerification;
        break;
      case VerificationContext.EMAIL_VERIFICATION:
        template = EmailTemplate.EmailVerification;
        break;
      case VerificationContext.PASSWORD_RESET:
        template = EmailTemplate.ForgotPassword;
        break;
      case VerificationContext.ACCOUNT_DELETION:
        template = EmailTemplate.AccountDeletion;
        break;
    }
    await this.emailService.sendEmail({
      to: [user.email],
      template,
      data: {
        name: `${user.firstName} ${user.lastName}`,
        otp: code,
        expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
      },
    });

    // Only now that the code is genuinely on its way does it replace the
    // previous one. If the send above threw, the user keeps whatever code
    // they already had.
    await persist();
  }

  async sendPhoneCode(phoneNumber: string, ip: string) {
    await this.twilioService.sendVerificationCode(phoneNumber, ip);
  }

  async delete(where: FindOptionsWhere<Verification>) {
    await this.verificationsRepository.delete(where);
  }
}
