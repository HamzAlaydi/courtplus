import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PhoneLoginDto, SocialLoginDto } from './dto/login.dto';
import { PhoneSignupDto } from './dto/signup.dto';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { SendPhoneCodeDto } from './dto/send-code.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { IpAddress, getIpAddress } from 'src/decorators/ip.decorator';
import { UserAgent } from 'src/decorators/user-agent.decorator';
import { User } from 'src/modules/users/entities/user.entity';
import {
  CheckUsernameDto,
  CheckUsernameResponseDto,
} from './dto/check-username.dto';
import { UsersService } from 'src/modules/users/users.service';
import { INVALID_CREDENTIALS, TOO_MANY_REQUESTS } from '../shared/error-codes';
import { DeviceId } from 'src/decorators/device.decorator';
import { normalizeEmailKey, normalizePhoneKey, authAttemptKey} from './util/throttle-key';

@ApiTags('Users Authentication')
@Controller('auth/customers')
@UseGuards(ThrottlerGuard)
@SkipThrottle({ phone: true, auth: true })
export class UserAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  @ApiOperation({ summary: 'Register a new user with phone number' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: PhoneSignupDto })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier',
    required: true,
  })
  @Post('signup/phone')
  @Throttle({
    auth: {
      generateKey(req) {
        const ip = getIpAddress(req);
        return `signup-phone-${ip}`;
      },
    },
  })
  async signupPhone(
    @Body() signupDto: PhoneSignupDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
    @DeviceId() deviceId: string,
  ): Promise<LoginResponseDto<User>> {
    return this.authService.signupWithPhone(signupDto, ip, userAgent, deviceId);
  }

  @ApiOperation({ summary: 'Check if username is available' })
  @ApiResponse({
    status: 200,
    description: 'Username is available',
    type: CheckUsernameResponseDto,
  })
  @ApiBody({ type: CheckUsernameDto })
  @ApiResponse({
    status: 200,
    description: 'Username is available',
    type: CheckUsernameResponseDto,
  })
  @Post('check-username')
  async checkUsername(
    @Body() body: CheckUsernameDto,
  ): Promise<CheckUsernameResponseDto> {
    return this.usersService.checkUsername(body.username);
  }

  @ApiOperation({ summary: 'Login with social provider' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: SocialLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: LoginResponseDto,
  })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier',
    required: true,
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const ip = getIpAddress(req);
        return `login-social-${ip}`;
      },
    },
  })
  @Post('login/social')
  async loginSocial(
    @Body() loginDto: SocialLoginDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
    @DeviceId() deviceId: string,
  ): Promise<LoginResponseDto<User>> {
    return this.authService.loginWithSocial(loginDto, ip, userAgent, deviceId);
  }

  @ApiOperation({ summary: 'Login with phone number' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: INVALID_CREDENTIALS })
  @ApiResponse({ status: 429, description: TOO_MANY_REQUESTS })
  @ApiBody({ type: PhoneLoginDto })
  @ApiHeader({
    name: 'x-device-id',
    description: 'Unique device identifier',
    required: true,
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        // Identity + origin. Keyed on the phone alone, six requests from
        // anyone who knew the number blocked that customer's login for an
        // hour.
        return authAttemptKey(
          'login-phone',
          normalizePhoneKey(request.body.phoneNumber),
          getIpAddress(req),
        );
      },
    },
  })
  @Post('login/phone')
  async loginPhone(
    @Body() loginDto: PhoneLoginDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
    @DeviceId() deviceId: string,
  ): Promise<LoginResponseDto<User>> {
    return this.authService.loginWithPhone(loginDto, ip, userAgent, deviceId);
  }

  @ApiOperation({ summary: 'send verification code' })
  @ApiResponse({ status: 200, description: 'Code successfully resent' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @ApiBody({ type: SendPhoneCodeDto })
  @SkipThrottle({ phone: false })
  @Throttle({
    phone: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        // DELIBERATELY keyed on the phone alone, unlike login above: this
        // endpoint sends a real SMS, so the limit exists to stop anyone
        // bombing one victim's handset (and our Twilio bill) from many
        // addresses. Adding the origin here would give each attacker their
        // own budget against the same number.
        return `send-code-${normalizePhoneKey(request.body.phoneNumber)}`;
      },
    },
  })
  @Post('send-code')
  async sendPhoneCode(
    @Body() body: SendPhoneCodeDto,
    @IpAddress() ip: string,
  ): Promise<void> {
    return this.authService.sendPhoneCode(body, ip);
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
  ): Promise<LoginResponseDto<User>> {
    return this.authService.refreshToken<User>(user, ip, userAgent);
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
