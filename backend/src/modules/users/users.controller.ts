import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SendPhoneCodeDto } from 'src/modules/auth/dto/send-code.dto';
import { IpAddress } from 'src/decorators/ip.decorator';
import { VerifyPhoneCodeDto } from 'src/modules/auth/dto/verify-code.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UpsertSportDto } from './dto/upsert-sport.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { ListUsersResponseDto } from './dto/list-users-response.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { VerifyUpdateEmailCodeDto } from './dto/verify-email.dto';
import { UserSport } from './entities/sport.entity';
import { AssetType } from '../assets/entities/asset.entity';
import { UserPreferencesDto } from './dto/user-preferences.dto';
import { UserPreferences } from './entities/user-preferences.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user',
    type: User,
  })
  @AuthorizedUserType.isCustomer()
  @Get('me')
  async getMe(@CurrentUser() currentUser: SessionUser): Promise<User> {
    return this.usersService.getById(currentUser.id, {
      cached: true,
      relations: ['sports'],
    });
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiBody({
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @Patch('me')
  @AuthorizedUserType.isCustomer()
  async updateMe(
    @CurrentUser() currentUser: SessionUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(currentUser.id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete current user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @Delete('me')
  @AuthorizedUserType.isCustomer()
  async deleteAccount(@CurrentUser() currentUser: SessionUser): Promise<void> {
    await this.usersService.delete(currentUser);
  }

  @ApiOperation({ summary: 'Update phone number' })
  @ApiResponse({
    status: 200,
    description: 'Phone number updated successfully',
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    phone: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `update-phone-${request.user.id}-${request.body.phoneNumber}`;
      },
    },
  })
  @AuthorizedUserType.isCustomer()
  @Post('me/phone/code')
  async updatePhoneNumber(
    @CurrentUser() currentUser: SessionUser,
    @Body() updatePhoneDto: SendPhoneCodeDto,
    @IpAddress() ip: string,
  ): Promise<void> {
    await this.usersService.sendUpdatePhoneNumberVerification(
      updatePhoneDto,
      currentUser,
      ip,
    );
  }

  @ApiOperation({ summary: 'Verify phone number' })
  @ApiResponse({
    status: 200,
    description: 'Phone number verified successfully',
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `verify-phone-${request.user.id}-${request.body.phoneNumber}`;
      },
    },
  })
  @AuthorizedUserType.isCustomer()
  @Post('me/phone/verify')
  async verifyPhoneNumber(
    @CurrentUser() currentUser: SessionUser,
    @Body() verifyPhoneDto: VerifyPhoneCodeDto,
  ): Promise<void> {
    await this.usersService.verifyPhoneNumber(verifyPhoneDto, currentUser);
  }

  @ApiOperation({ summary: 'Add/update a sport for the current user' })
  @ApiResponse({
    status: 201,
    description: 'Sport added/updated successfully',
  })
  @AuthorizedUserType.isCustomer()
  @Post('me/sports')
  async addSport(
    @CurrentUser() currentUser: SessionUser,
    @Body() addSportDto: UpsertSportDto,
  ): Promise<UserSport> {
    return this.usersService.upsertSport(currentUser.id, addSportDto);
  }

  @ApiOperation({ summary: 'Get sports for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Sports found successfully',
    type: [UserSport],
  })
  @AuthorizedUserType.isCustomer()
  @Get('me/sports')
  async getSports(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserSport[]> {
    return this.usersService.getSports(currentUser.id);
  }

  @ApiOperation({ summary: 'Delete a sport for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Sport deleted successfully',
  })
  @AuthorizedUserType.isCustomer()
  @Delete('me/sports/:sportId')
  async deleteSport(
    @CurrentUser() currentUser: SessionUser,
    @Param('sportId', ParseUUIDPipe) sportId: string,
  ): Promise<void> {
    return this.usersService.deleteSport(currentUser.id, sportId);
  }

  @ApiOperation({ summary: 'Search customers' })
  @ApiResponse({
    status: 200,
    description: 'Users found successfully',
    type: ListUsersResponseDto,
  })
  @Get()
  async list(
    @Query() query: ListUsersDto,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<ListUsersResponseDto> {
    return this.usersService.find(query, currentUser);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    description: 'User found successfully',
    type: User,
  })
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<User> {
    return this.usersService.getById(id, {
      cached: false,
      relations: ['sports'],
      friendship: currentUser.id,
    });
  }

  @ApiOperation({ summary: 'Send verification code to update email' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `update-email-${request.user.id}-${request.body.email}`;
      },
    },
  })
  @AuthorizedUserType.isCustomer()
  @Post('me/email/code')
  async sendEmailVerification(
    @CurrentUser() currentUser: SessionUser,
    @Body() updateEmailDto: SendEmailCodeDto,
  ): Promise<void> {
    await this.usersService.sendUpdateEmailVerification(
      updateEmailDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Verify email with code' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @Post('me/email/verify')
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `verify-email-${request.user.id}-${request.body.email}`;
      },
    },
  })
  @AuthorizedUserType.isCustomer()
  async verifyEmail(
    @CurrentUser() currentUser: SessionUser,
    @Body() verifyEmailDto: VerifyUpdateEmailCodeDto,
  ): Promise<void> {
    await this.usersService.verifyEmail(verifyEmailDto, currentUser);
  }

  @Delete('me/avatar')
  @AuthorizedUserType.isCustomer()
  @ApiOperation({ summary: 'Remove user avatar' })
  @ApiResponse({
    status: 200,
    description: 'Avatar removed successfully',
    type: User,
  })
  async removeAvatar(@CurrentUser() currentUser: SessionUser): Promise<void> {
    return this.usersService.removeAsset(currentUser.id, AssetType.ProfilePicture);
  }

  @Delete('me/cover')
  @AuthorizedUserType.isCustomer()
  @ApiOperation({ summary: 'Remove user cover photo' })
  @ApiResponse({
    status: 200,
    description: 'Cover photo removed successfully',
    type: User,
  })
  async removeCoverPhoto(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    return this.usersService.removeAsset(currentUser.id, AssetType.CoverPicture);
  }

  @Get('me/preferences')
  @AuthorizedUserType.isCustomer()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully',
    type: UserPreferences,
  })
  @AuthorizedUserType.isCustomer()
  async getPreferences(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<UserPreferences | null> {
    return this.usersService.getPreferences(currentUser.id, currentUser.deviceId);
  }

  @Patch('me/preferences')
  @AuthorizedUserType.isCustomer()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiBody({ type: UserPreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'User preferences updated successfully',
    type: UserPreferences,
  })
  @AuthorizedUserType.isCustomer()
  async updatePreferences(
    @CurrentUser() currentUser: SessionUser,
    @Body() updatePreferencesDto: UserPreferencesDto,
  ): Promise<UserPreferences> {
    return this.usersService.updatePreferences(currentUser.id, currentUser.deviceId, updatePreferencesDto);
  }
}
