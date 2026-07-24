import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailLoginDto, PhoneLoginDto, SocialLoginDto } from './dto/login.dto';
import { EmailSignupDto, PhoneSignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { verifyPassword, hashPassword } from './util/password';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FirebaseService } from 'src/modules/shared/services/firebase.service';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  VerificationChannel,
  VerificationContext,
} from './entities/verification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, AccountProvider } from './entities/account.entity';
import { Session, SessionStatus } from './entities/session.entity';
import { SendPhoneCodeDto } from './dto/send-code.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { StaffService } from 'src/modules/staff/staff.service';
import { dayjs } from '../shared/dayjs';
import { parsePhoneNumberWithError } from 'libphonenumber-js/max';
import { Staffer } from '../staff/entities/staff.entity';
import { UserType } from './@types/user.type';
import { User } from '../users/entities/user.entity';
import { RefreshTokenPayload, SessionUser } from './@types/session';
import {
  INVALID_EMAIL,
  INVALID_REFRESH_TOKEN,
  INVALID_CREDENTIALS,
  ACCOUNT_ALREADY_EXISTS,
  USERNAME_ALREADY_EXISTS,
  PHONE_NUMBER_ALREADY_EXISTS,
  ACCOUNT_NOT_RECOVERABLE,
  ACCOUNT_DELETED,
  INVALID_TOKEN,
} from 'src/modules/shared/error-codes';
import { VerificationService } from './verification.service';
import { sanitizeStaff } from '../staff/util';
import type {
  ForgotPasswordEvent,
  UserCreatedEvent,
  UserPayload,
} from './auth.events';
import { AuthEvent } from './auth.events';
import { sanitizeUser } from './util/user';
@Injectable()
export class AuthService {
  constructor(
    readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly firebaseService: FirebaseService,
    private readonly verificationService: VerificationService,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
  ) { }

  async signupWithEmail(
    data: EmailSignupDto,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto<
    Omit<Staffer, 'password' | 'lastPasswordChangeAt'>
  > | void> {
    const { firstName, lastName, email, password, token } = data;
    const existingUser = await this.staffService.exists({ email });
    if (existingUser) {
      throw new BadRequestException(ACCOUNT_ALREADY_EXISTS);
    }
    const hashedPassword = await hashPassword(password);
    const user = await this.staffService.create({
      firstName,
      lastName,
      email,
      token,
      password: hashedPassword,
    });

    this.eventEmitter.emit(AuthEvent.USER_CREATED, {
      user,
      provider: AccountProvider.EMAIL,
      invited: !!token,
    } satisfies UserCreatedEvent);

    if (token) {
      return this.loginWithEmail({ email, password }, ip, userAgent);
    }
  }

  async signupWithPhone(
    {
      phoneNumber,
      code,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      username,
    }: PhoneSignupDto,
    ip: string,
    userAgent: string,
    deviceId: string
  ): Promise<LoginResponseDto<User>> {
    const existingUser = await this.usersService.get([
      { username },
      { phoneNumber },
    ]);

    if (existingUser) {
      if (existingUser.deletedAt) {
        throw new BadRequestException(ACCOUNT_ALREADY_EXISTS);
      } else if (existingUser.username === username) {
        throw new BadRequestException(USERNAME_ALREADY_EXISTS);
      } else if (existingUser.phoneNumber === phoneNumber) {
        throw new BadRequestException(PHONE_NUMBER_ALREADY_EXISTS);
      }

      throw new BadRequestException(ACCOUNT_ALREADY_EXISTS);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Customer,
      identifier: phoneNumber,
      channel: VerificationChannel.PHONE,
      context: VerificationContext.ACCOUNT_VERIFICATION,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    const parsedPhoneNumber = parsePhoneNumberWithError(phoneNumber);
    const formattedPhoneNumber = parsedPhoneNumber.format('E.164');
    const formattedDateOfBirth = dayjs(dateOfBirth)
      .startOf('day')
      .format('YYYY-MM-DD');

    const user = await this.usersService.create(
      {
        phoneNumber: formattedPhoneNumber,
        firstName,
        lastName,
        dateOfBirth: formattedDateOfBirth,
        gender,
        username,
        verifiedAt: new Date(),
      },
      AccountProvider.PHONE,
    );

    const { accessToken, refreshToken } = await this.createLoginSession(
      { ...user, type: UserType.Customer, deviceId },
      ip,
      userAgent,
    );

    this.eventEmitter.emit(AuthEvent.USER_CREATED, {
      user,
      provider: AccountProvider.PHONE,
    } satisfies UserCreatedEvent);

    return {
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    };
  }

  async recoverAccount(user: User) {
    if (dayjs().diff(user.deletedAt, 'days') <= 30) {
      await this.usersService.update(user.id, {
        deletedAt: null,
      });
      return;
    }
    throw new BadRequestException(ACCOUNT_NOT_RECOVERABLE);
  }

  async loginWithSocial(
    { token, recover }: SocialLoginDto,
    ip: string,
    userAgent: string,
    deviceId: string,
  ): Promise<LoginResponseDto<User>> {
    let decoddedToken;
    try {
      decoddedToken = await this.firebaseService.verifyIdToken(token);
    } catch (error) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }

    if (!decoddedToken?.firebase?.sign_in_provider) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }

    const provider = decoddedToken.firebase.sign_in_provider.split(
      '.',
    )[0] as AccountProvider;
    const { email, name, email_verified, picture, uid } = decoddedToken;

    if (!email) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
    // eslint-disable-next-line prefer-const
    let [firstName, lastName] = name ? name.split(' ') : [email.split('@')[0]];

    let user = await this.usersService.get({ email });
    if (user) {
      if (user.deletedAt) {
        if (!recover) {
          throw new BadRequestException(ACCOUNT_DELETED);
        }
        await this.recoverAccount(user);
      }
      const account = await this.accountsRepository.findOne({
        where: { userId: user.id, provider },
      });
      if (!account) {
        await this.accountsRepository.save({
          userId: user.id,
          provider,
        });
        if (!user.verifiedAt) {
          await this.usersService.update(user.id, {
            verifiedAt: new Date(),
          });
        }
      }
    } else {
      let username = email.split('@')[0].toLowerCase();
      const { available, suggestions } =
        await this.usersService.checkUsername(username);

      if (!available && suggestions) {
        username = suggestions[0];
      }

      user = await this.usersService.create(
        {
          email,
          firstName,
          lastName,
          avatarUrl: picture,
          firebaseUid: uid,
          username,
          verifiedAt: email_verified ? new Date() : null,
        },
        provider,
      );
    }

    const { accessToken, refreshToken } = await this.createLoginSession(
      { ...user, type: UserType.Customer, deviceId },
      ip,
      userAgent,
    );

    return {
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    };
  }

  async loginWithEmail(
    { email, password }: EmailLoginDto,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto<Staffer>> {
    const user = await this.staffService.getByEmail(email);
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const isPasswordValid = await verifyPassword({
      hash: user.password,
      password: password,
    });

    if (!isPasswordValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!user.verifiedAt) {
      await this.verificationService.sendVerificationEmail(
        user,
        VerificationContext.ACCOUNT_VERIFICATION,
      );
      return {
        requiresVerification: true,
      };
    }

    const { accessToken, refreshToken } = await this.createLoginSession(
      { ...user, type: UserType.Staff, role: user.role },
      ip,
      userAgent,
    );
    return {
      accessToken,
      refreshToken,
      user: sanitizeStaff(user),
    };
  }

  async loginWithPhone(
    { phoneNumber, code, recover }: PhoneLoginDto,
    ip: string,
    userAgent: string,
    deviceId: string,
  ): Promise<LoginResponseDto<User>> {
    const user = await this.usersService.get({ phoneNumber });
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.deletedAt) {
      if (!recover) {
        throw new BadRequestException(ACCOUNT_DELETED);
      }
      await this.recoverAccount(user);
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      code,
      userType: UserType.Customer,
      identifier: phoneNumber,
      channel: VerificationChannel.PHONE,
    });

    if (!isValid) {
      throw new BadRequestException(errorCode);
    }

    const { accessToken, refreshToken } = await this.createLoginSession(
      { ...user, type: UserType.Customer, deviceId },
      ip,
      userAgent,
    );
    return {
      accessToken,
      refreshToken,
      user: sanitizeUser(user),
    };
  }

  async forgotPassword(email: string) {
    const staffer = await this.staffService.getByEmail(email);
    if (!staffer) {
      return;
    }

    await this.verificationService.sendVerificationEmail(
      staffer,
      VerificationContext.PASSWORD_RESET,
    );
  }

  async resetPassword({ code: value, newPassword, email }: ResetPasswordDto) {
    const staffer = await this.staffService.getByEmail(email);

    if (!staffer) {
      return {
        isValid: false,
        errorCode: INVALID_EMAIL,
      };
    }

    const { isValid, errorCode } = await this.verificationService.verifyCode({
      identifier: email,
      code: value,
      userType: UserType.Staff,
      context: VerificationContext.PASSWORD_RESET,
      channel: VerificationChannel.EMAIL,
    });

    if (!isValid) {
      return {
        isValid,
        errorCode,
      };
    }

    const hashedPassword = await hashPassword(newPassword);
    const user = await this.staffService.update(staffer.id, {
      password: hashedPassword,
    });

    this.eventEmitter.emit(AuthEvent.PASSWORD_CHANGED, {
      user,
    } satisfies UserPayload);
    return {
      isValid,
      errorCode,
    };
  }

  private async createLoginSession(
    user: Partial<SessionUser>,
    ip: string,
    userAgent: string,
  ) {
    const sid = user.sid || uuidv4();

    let accessTokenPayload: SessionUser = {
      email: user.email,
      id: user.id,
      type: user.type,
      sid,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      deviceId: user.deviceId,
    } satisfies SessionUser;

    if (user.type === UserType.Staff) {
      accessTokenPayload.tenantId = user.tenantId;
    }

    const refreshToken = this.jwtService.sign(
      {
        id: user.id,
        sid,
        type: user.type,
        role: user.role,
        deviceId: user.deviceId,
      } satisfies RefreshTokenPayload,
      {
        subject: user.id,
        audience: 'api',
        issuer: 'api',
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: '30d',
      },
    );

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      subject: user.id,
      audience: 'api',
      issuer: 'api',
      expiresIn: '15m',
    });

    const hashedRefreshToken = await hashPassword(refreshToken);

    await this.sessionsRepository.upsert(
      {
        id: sid,
        userId: user.id,
        ip,
        userAgent,
        deviceId: user.deviceId,
        refreshToken: hashedRefreshToken,
        expiresAt: dayjs().add(30, 'days').toDate(),
      },
      { conflictPaths: ['id'] },
    );

    return { accessToken, refreshToken };
  }

  async sendVerificationCode({ email }: { email: string }) {
    const staffer = await this.staffService.getByEmail(email);
    if (!staffer) {
      throw new BadRequestException(INVALID_EMAIL);
    }
    await this.verificationService.sendVerificationEmail(
      staffer,
      VerificationContext.ACCOUNT_VERIFICATION,
    );
  }

  async verifyAccount(userId: string) {
    const user = await this.staffService.update(userId, {
      verifiedAt: new Date(),
    });

    this.eventEmitter.emit(AuthEvent.USER_VERIFIED, {
      user,
    } satisfies UserPayload);
  }

  async sendPhoneCode({ phoneNumber }: SendPhoneCodeDto, ip: string) {
    await this.verificationService.sendPhoneCode(phoneNumber, ip);
  }

  async refreshToken<T>(
    user: SessionUser,
    ip: string,
    userAgent: string,
  ): Promise<LoginResponseDto<T>> {
    const { accessToken, refreshToken } = await this.createLoginSession(
      user,
      ip,
      userAgent,
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(user: SessionUser) {
    await this.sessionsRepository.update(
      { userId: user.id, id: user.sid },
      { status: SessionStatus.REVOKED },
    );
  }

  async getSessionByRefreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        audience: 'api',
        issuer: 'api',
        secret: this.configService.get('jwt.refreshSecret'),
      }) as RefreshTokenPayload;

      const session = await this.sessionsRepository
        .createQueryBuilder('session')
        .where('session.id = :id', { id: decoded.sid })
        .leftJoinAndMapOne(
          'session.user',
          decoded.type === UserType.Staff ? Staffer : User,
          'user',
          'user.id = session.userId AND user.deletedAt IS NULL',
        )
        .getOne();

      const isValid = await verifyPassword({
        hash: session.refreshToken,
        password: refreshToken,
      });
      if (
        !session ||
        !session.user ||
        session.status !== SessionStatus.ACTIVE ||
        session.expiresAt < new Date() ||
        !isValid
      ) {
        throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
      }

      const user = session.user;

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          type: decoded.type,
          role:
            decoded.type === UserType.Staff ? (user as Staffer).role : undefined,
          tenantId:
            decoded.type === UserType.Staff
              ? (user as Staffer).tenantId
              : undefined,
        },
        id: session.id,
      };
    } catch (error) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }
  }

  async getUserActiveSessions(userId: string) {
    return this.sessionsRepository.find({
      where: { userId, status: SessionStatus.ACTIVE },
    });
  }

  @OnEvent(AuthEvent.USER_CREATED)
  private async handleUserCreated({
    user,
    provider,
    invited,
  }: UserCreatedEvent) {
    if (provider == AccountProvider.EMAIL && !invited) {
      await this.verificationService.sendVerificationEmail(
        user as Staffer,
        VerificationContext.ACCOUNT_VERIFICATION,
      );
    }
  }

  @OnEvent(AuthEvent.FORGOT_PASSWORD)
  private async handleForgotPassword({ user, code }: ForgotPasswordEvent) { }

  @OnEvent(AuthEvent.PASSWORD_CHANGED)
  private async handlePasswordReset({ user }: UserPayload) {
    await Promise.all([
      this.verificationService.delete({
        userId: user.id,
      }),
      this.staffService.update(user.id, {
        lastPasswordChangeAt: new Date(),
      }),
    ]);
  }

  @OnEvent(AuthEvent.USER_VERIFIED)
  async handleUserVerified({ user }: UserPayload) {
    await this.verificationService.delete({
      userId: user.id,
      context: VerificationContext.ACCOUNT_VERIFICATION,
    });
  }
}
