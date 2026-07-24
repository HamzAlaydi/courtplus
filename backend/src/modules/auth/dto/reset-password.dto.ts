import { IsString, IsEmail, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  INVALID_CODE,
  INVALID_EMAIL,
  INVALID_PASSWORD,
} from 'src/modules/shared/error-codes';
import { Transform } from 'class-transformer';
export class ResetPasswordDto {
  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsString({ message: INVALID_PASSWORD })
  @MinLength(8, { message: INVALID_PASSWORD })
  newPassword: string;

  @ApiProperty({
    description: 'Verification code (exactly 8 characters)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: INVALID_CODE })
  @Length(6, 6, { message: INVALID_CODE })
  code: string;

  @ApiProperty({
    description: 'identifier of the user (email)',
    example: '123sadfasf@gmail.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}
