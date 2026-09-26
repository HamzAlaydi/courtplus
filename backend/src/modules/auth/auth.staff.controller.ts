import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailLoginDto } from './dto/login.dto';
import { EmailSignupDto } from './dto/signup.dto';
import { ChangeUnverifiedEmailDto } from './dto/change-unverified-email.dto';
import { SendVerificationCodeDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailCodeDto } from './dto/verify-code.dto';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { IpAddress, getIpAddress } from 'src/decorators/ip.decorator';
import { UserAgent } from 'src/decorators/user-agent.decorator';
import {
  VerificationChannel,
  VerificationContext,
} from './entities/verification.entity';
import { UserType } from './@types/user.type';
import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { VerificationService } from './verification.service';
import { normalizeEmailKey, normalizePhoneKey, authAttemptKey} from './util/throttle-key';
@ApiTags('Staff Authentication')
@Controller('auth/staff')
@UseGuards(ThrottlerGuard)
@SkipThrottle({ phone: true })
export class StaffAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) { }

  @ApiOperation({ summary: 'Register a new staff with email' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: EmailSignupDto })
  @Post('signup')
  @Throttle({
    auth: {
      generateKey(req) {
        const ip = getIpAddress(req);
        return `signup-email-${ip}`;
      },
    },
  })
  async signup(
    @Body() signupDto: EmailSignupDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ): Promise<
    LoginResponseDto<Staffer> | { verificationSent: boolean }
  > {
    // Returns { verificationSent } for a normal signup so the dashboard can
    // tell the vendor the code could not be sent, instead of claiming it was.
    // An invited signup still returns a session.
    return this.authService.signupWithEmail(signupDto, ip, userAgent) as Promise<
      LoginResponseDto<Staffer> | { verificationSent: boolean }
    >;
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: EmailLoginDto })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return authAttemptKey(
          'login-email',
          normalizeEmailKey(request.body.email),
          getIpAddress(req),
        );
      },
    },
  })
  @Post('login')
  async login(
    @Body() loginDto: EmailLoginDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ): Promise<LoginResponseDto<Staffer>> {
    return this.authService.loginWithEmail(loginDto, ip, userAgent);
  }

  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code resent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: SendVerificationCodeDto })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `resend-code-${normalizeEmailKey(request.body.email)}`;
      },
    },
  })
  @Post('resend-verification-code')
  async resendVerificationCode(
    @Body() body: SendVerificationCodeDto,
  ): Promise<void> {
    return this.authService.sendVerificationCode(body);
  }

  @ApiOperation({
    summary: 'Correct the email on an account that is not verified yet',
  })
  @ApiResponse({ status: 200, description: 'Address changed, new code sent' })
  @ApiResponse({ status: 400, description: 'New address already in use' })
  @ApiResponse({ status: 401, description: 'Unknown, verified, or wrong password' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: ChangeUnverifiedEmailDto })
  @Throttle({
    auth: {
      // Keyed on the ORIGIN as well as the address. This endpoint takes a
      // password, so unlike resend it is a guessing target: keying it on the
      // address alone would also let anyone burn a stranded vendor's only
      // route out of a mistyped address.
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return authAttemptKey(
          'change-unverified-email',
          normalizeEmailKey(request.body.email),
          getIpAddress(req),
        );
      },
    },
  })
  @Post('change-unverified-email')
  async changeUnverifiedEmail(
    @Body() body: ChangeUnverifiedEmailDto,
  ): Promise<{ verificationSent: boolean }> {
    return this.authService.changeUnverifiedEmail(body);
  }
  @ApiOperation({ summary: 'Verify code' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: VerifyEmailCodeDto })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `verify-code-${normalizeEmailKey(request.body.email)}`;
      },
    },
  })
  @Post('verify-code')
  async verifyCode(
    @Body() body: VerifyEmailCodeDto,
  ): Promise<{ verified: boolean; errorCode: string }> {
    const { isValid, errorCode, context, userId } =
      await this.verificationService.verifyCode({
        ...body,
        channel: VerificationChannel.EMAIL,
        identifier: body.email,
        userType: UserType.Staff,
      });
    if (isValid && context === VerificationContext.ACCOUNT_VERIFICATION) {
      await this.authService.verifyAccount(userId);
    }
    return { verified: isValid, errorCode };
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: SendVerificationCodeDto })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return authAttemptKey(
          'forgot-password',
          normalizeEmailKey(request.body.email),
          getIpAddress(req),
        );
      },
    },
  })
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: SendVerificationCodeDto,
  ): Promise<void> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: ResetPasswordDto })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `reset-password-${normalizeEmailKey(request.body.email)}`;
      },
    },
  })
  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ isValid: boolean; errorCode: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  // Already bearer-authenticated; the per-IP auth throttle (6/15 min) locked
  // whole offices out of token refresh.
  @SkipThrottle({ auth: true })
  @Post('refresh-token')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @CurrentUser() user: SessionUser,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ): Promise<LoginResponseDto<Staffer>> {
    return this.authService.refreshToken<Staffer>(user, ip, userAgent);
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @SkipThrottle({ auth: true })
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: SessionUser): Promise<void> {
    return this.authService.logout(user);
  }
}
