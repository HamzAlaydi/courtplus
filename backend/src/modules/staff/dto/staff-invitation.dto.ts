import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffRole } from '../entities/enum';
import { Optional } from '@nestjs/common';

const INVITATION_ALLOWED_ROLES = [StaffRole.ADMIN, StaffRole.USER, StaffRole.SUPER_ADMIN] as const;

export class CreateStaffInvitationDto {
  @ApiProperty({
    description: 'Email address of the staff to invite',
    example: 'staff@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @ApiProperty({
    description: 'Role of the staff',
    enum: INVITATION_ALLOWED_ROLES,
    example: StaffRole.USER,
  })
  @IsIn(INVITATION_ALLOWED_ROLES)
  @Optional()
  role?: StaffRole.ADMIN | StaffRole.USER;


  @ApiProperty({
    description: 'Branch id of the staff to invite',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateStaffRoleDto {
  @ApiProperty({
    description: 'Role of the staff',
    enum: StaffRole,
    example: StaffRole.USER,
  })
  @IsEnum(StaffRole)
  role: StaffRole;
}
