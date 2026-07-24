import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailLoginDto } from './dto/login.dto';
import { EmailSignupDto } from './dto/signup.dto';
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
  ): Promise<LoginResponseDto<Staffer> | void> {
    return this.authService.signupWithEmail(signupDto, ip, userAgent);
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
        return `login-email-${request.body.email}`;
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
        return `login-email-${request.body.email}`;
      },
    },
  })
  @Post('resend-verification-code')
  async resendVerificationCode(
    @Body() body: SendVerificationCodeDto,
  ): Promise<void> {
    return this.authService.sendVerificationCode(body);
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
        return `verify-code-${request.body.email}`;
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
        return `forgot-password-${request.body.email}`;
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
        return `reset-password-${request.body.email}`;
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
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: SessionUser): Promise<void> {
    return this.authService.logout(user);
  }
}
