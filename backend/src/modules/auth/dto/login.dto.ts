import {
  IsEmail,
  IsString,
  MinLength,
  IsPhoneNumber,
  Length,
  IsJWT,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  INVALID_CODE,
  INVALID_EMAIL,
  INVALID_PASSWORD,
  INVALID_PHONE_NUMBER,
  INVALID_TOKEN,
} from 'src/modules/shared/error-codes';
export class EmailLoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'password123',
    minLength: 8,
  })
  @IsString({ message: INVALID_PASSWORD })
  @MinLength(8, { message: INVALID_PASSWORD })
  password: string;
}

export class PhoneLoginDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+201000000000',
  })
  @IsPhoneNumber(undefined, { message: INVALID_PHONE_NUMBER })
  phoneNumber: string;

  @ApiProperty({
    description: 'Verification code (exactly 6 characters)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: INVALID_CODE })
  @Length(6, 6, { message: INVALID_CODE })
  code: string;

  @ApiPropertyOptional({
    description: 'Whether to recover the account if it is deleted',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  recover?: boolean;
}

export class SocialLoginDto {
  @ApiProperty({
    description: 'Social provider authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: INVALID_TOKEN })
  @IsJWT({ message: INVALID_TOKEN })
  token: string;

  @ApiPropertyOptional({
    description: 'Whether to recover the account if it is deleted',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  recover?: boolean;
}
