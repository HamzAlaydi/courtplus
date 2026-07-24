import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { StaffRole } from '../../staff/entities/enum';

export class CreateOpsAdminDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'ops@courtplusapp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssword', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateOpsAdminRoleDto {
  @ApiProperty({
    description: 'The new role for the admin',
    enum: StaffRole,
    example: StaffRole.ADMIN,
  })
  @IsEnum(StaffRole)
  role: StaffRole;
}
