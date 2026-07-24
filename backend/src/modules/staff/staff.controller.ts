import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
} from './dto/change-email.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
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
import { StaffService } from './staff.service';
import { GetStaffDto } from './dto/get-staff.dto';
import { sanitizeStaff } from './util';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import {
  CreateStaffInvitationDto,
  UpdateStaffRoleDto,
} from './dto/staff-invitation.dto';
import {
  RequestAccountDeletionDto,
  VerifyAccountDeletionDto,
} from './dto/delete-account.dto';
import { BranchStaffDto } from './dto/branch-staff.dto';
import { ResponseStaff, ResponseStaffInvitation } from './types';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ListStaffResponseDto } from './dto/list-staff-response.dto';
import { ListStaffDto } from './dto/list-staff.dto';
import { StaffRole } from './entities/enum';
@Controller('staff')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@AuthorizedUserType.isStaff()
@ApiTags('Staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user',
    type: GetStaffDto,
  })
  @Get('me')
  async getMe(@CurrentUser() currentUser: SessionUser): Promise<ResponseStaff> {
    const user = await this.staffService.getById(currentUser.id);
    return sanitizeStaff(user);
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: GetStaffDto,
  })
  @ApiBody({
    type: UpdateStaffDto,
  })
  @Patch('me')
  async updateMe(
    @CurrentUser() currentUser: SessionUser,
    @Body() updateStaffDto: UpdateStaffDto,
  ): Promise<ResponseStaff> {
    const staff = await this.staffService.update(
      currentUser.id,
      updateStaffDto,
    );
    return sanitizeStaff(staff);
  }

  @ApiOperation({ summary: 'Request account deletion' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent to email',
  })
  @ApiBody({
    type: RequestAccountDeletionDto,
  })
  @Post('me/delete')
  async requestAccountDeletion(
    @CurrentUser() currentUser: SessionUser,
    @Body() requestAccountDeletionDto: RequestAccountDeletionDto,
  ): Promise<void> {
    await this.staffService.requestAccountDeletion(
      requestAccountDeletionDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Verify account deletion' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiBody({
    type: VerifyAccountDeletionDto,
  })
  @Post('me/delete/verify')
  async verifyAccountDeletion(
    @CurrentUser() currentUser: SessionUser,
    @Body() verifyAccountDeletionDto: VerifyAccountDeletionDto,
  ): Promise<void> {
    await this.staffService.verifyAccountDeletion(
      verifyAccountDeletionDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Update phone number' })
  @ApiResponse({
    status: 200,
    description: 'Phone number updated successfully',
  })
  @Throttle({
    auth: {
      generateKey(req) {
        const request = req.switchToHttp().getRequest();
        return `update-phone-number-${request.user.id}-${request.body.phoneNumber}`;
      },
    },
  })
  @UseGuards(ThrottlerGuard)
  @Post('me/phone/code')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async updatePhoneNumber(
    @CurrentUser() currentUser: SessionUser,
    @Body() updatePhoneDto: SendPhoneCodeDto,
    @IpAddress() ip: string,
  ): Promise<void> {
    await this.staffService.sendUpdatePhoneNumberVerification(
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
        return `update-phone-number-${request.user.id}-${request.body.phoneNumber}`;
      },
    },
  })
  @UseGuards(ThrottlerGuard)
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  @Post('me/phone/verify')
  async verifyPhoneNumber(
    @CurrentUser() currentUser: SessionUser,
    @Body() verifyPhoneDto: VerifyPhoneCodeDto,
  ): Promise<void> {
    await this.staffService.verifyPhoneNumber(verifyPhoneDto, currentUser);
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiBody({
    type: ChangePasswordDto,
  })
  @Post('me/change-password')
  async changePassword(
    @CurrentUser() currentUser: SessionUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.staffService.changePassword(currentUser.id, changePasswordDto);
  }

  @ApiOperation({ summary: 'Request email change' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent to new email',
  })
  @ApiBody({
    type: RequestEmailChangeDto,
  })
  @Post('me/email/change')
  async requestEmailChange(
    @CurrentUser() currentUser: SessionUser,
    @Body() requestEmailChangeDto: RequestEmailChangeDto,
  ): Promise<void> {
    await this.staffService.requestEmailChange(
      requestEmailChangeDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Verify email change' })
  @ApiResponse({
    status: 200,
    description: 'Email changed successfully',
  })
  @ApiBody({
    type: VerifyEmailChangeDto,
  })
  @Post('me/email/verify')
  async verifyEmailChange(
    @CurrentUser() currentUser: SessionUser,
    @Body() verifyEmailChangeDto: VerifyEmailChangeDto,
  ): Promise<void> {
    await this.staffService.verifyEmailChange(
      verifyEmailChangeDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Cancel email change' })
  @ApiResponse({
    status: 200,
    description: 'Email change cancelled',
  })
  @Post('me/email/cancel')
  async cancelEmailChange(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    await this.staffService.cancelEmailChange(currentUser);
  }

  @ApiOperation({ summary: 'Generate invite link for staff' })
  @ApiResponse({
    status: 201,
    description: 'Invite link generated successfully',
  })
  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.SUPER_ADMIN])
  @Post('invite')
  async generateInviteLink(
    @CurrentUser() currentUser: SessionUser,
    @Body() createInvitationDto: CreateStaffInvitationDto,
  ): Promise<void> {
    await this.staffService.generateInviteLink(
      createInvitationDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'List all  staff members' })
  @ApiResponse({
    status: 200,
    description: 'List of all staff members',
  })
  @Get()
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async listStaff(
    @CurrentUser() currentUser: SessionUser,
    @Query() listStaffDto: ListStaffDto,
  ): Promise<ListStaffResponseDto> {
    return this.staffService.listStaff(currentUser, listStaffDto);
  }

  @ApiOperation({ summary: 'List all staff invitations' })
  @ApiResponse({
    status: 200,
    description: 'List of all staff invitations',
  })
  @Get('invitations')
  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.SUPER_ADMIN])
  async listInvitations(
    @CurrentUser() currentUser: SessionUser,
  ): Promise<{ items: ResponseStaffInvitation[] }> {
    const invitations = await this.staffService.listInvitations(
      currentUser
    );
    return { items: invitations };
  }

  @ApiOperation({ summary: 'Revoke staff invitation' })
  @ApiResponse({
    status: 200,
    description: 'Invitation revoked successfully',
  })
  @Post('invitations/:id/revoke')
  @AuthorizedUserType.isStaff([StaffRole.OWNER, StaffRole.SUPER_ADMIN])
  async revokeInvitation(
    @Param('id', ParseUUIDPipe) invitationId: string,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    return this.staffService.revokeInvitation(
      invitationId,
      currentUser
    );
  }

  @ApiOperation({ summary: 'Update staff role' })
  @ApiResponse({
    status: 200,
    description: 'Staff role updated successfully',
  })
  @Patch(':id/role')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async updateStaffRole(
    @Param('id', ParseUUIDPipe) staffId: string,
    @Body() updateRoleDto: UpdateStaffRoleDto,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    return this.staffService.updateStaffRole(
      staffId,
      updateRoleDto,
      currentUser,
    );
  }

  @ApiOperation({ summary: 'Assign staff members to branch' })
  @ApiResponse({
    status: 201,
    description: 'Staff members assigned to a branch successfully',
  })
  @ApiBody({ type: BranchStaffDto })
  @Post('assign')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async assignStaffToBranch(
    @Body() { staffIds, branchId }: BranchStaffDto,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    return this.staffService.assignStaffToBranch(staffIds, branchId, currentUser);
  }

  @ApiOperation({ summary: 'Unassign staff members from branch' })
  @ApiResponse({
    status: 200,
    description: 'Staff members unassigned from branch successfully',
  })
  @ApiBody({ type: BranchStaffDto })
  @Post('unassign')
  @AuthorizedUserType.isStaff([StaffRole.OWNER])
  async unassignStaffFromBranch(
    @Body() { staffIds, branchId }: BranchStaffDto,
    @CurrentUser() currentUser: SessionUser,
  ): Promise<void> {
    return this.staffService.unassignStaffFromBranch(staffIds, branchId, currentUser);
  }
}
