import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TwilioService } from '../shared/services/twilio.service';
import { EmailService, EmailTemplate } from '../shared/services/email.service';
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
  private readonly DEV_CODE = '123456';
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
    const code = this.otpGenerator(codeLength);
    const hashedCode = await hashPassword(code);

    await this.verificationsRepository.upsert(
      {
        value: hashedCode,
        channel,
        expiresAt: dayjs().add(15, 'minutes').toDate(),
        userId,
        context,
        identifier,
      },
      {
        conflictPaths: ['userId', 'context'],
      },
    );
    return code;
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

    if (['development', 'dev'].includes(this.env) && code === this.DEV_CODE) {
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
    const userType = user instanceof Staffer ? UserType.Staff : UserType.Customer;
    const code = await this.createVerification({
      userId: user.id,
      context,
      identifier: user.email,
      channel: VerificationChannel.EMAIL,
      userType,
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
      },
    });
  }

  async sendPhoneCode(phoneNumber: string, ip: string) {
    await this.twilioService.sendVerificationCode(phoneNumber, ip);
  }

  async delete(where: FindOptionsWhere<Verification>) {
    await this.verificationsRepository.delete(where);
  }
}
