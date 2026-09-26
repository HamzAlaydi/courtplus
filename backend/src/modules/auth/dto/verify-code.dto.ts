import { NormalizePhone } from 'src/common/phone.transform';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationContext } from '../entities/verification.entity';
import {
  INVALID_CODE,
  INVALID_EMAIL,
  INVALID_PHONE_NUMBER,
  INVALID_VERIFICATION_TYPE,
} from 'src/modules/shared/error-codes';
export class VerifyPhoneCodeDto {
  @IsPhoneNumber(undefined, { message: INVALID_PHONE_NUMBER })
  @ApiProperty({
    description: 'The phone number to verify',
    example: '+201000000000',
  })
  @NormalizePhone()
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
}

export class VerifyEmailCodeDto {
  @ApiProperty({
    description: 'email address',
    example: 'test@test.com',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail(undefined, { message: INVALID_EMAIL })
  email: string;

  @ApiProperty({
    description: 'Verification code (exactly 6 characters)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: INVALID_CODE })
  @Length(6, 6, { message: INVALID_CODE })
  code: string;

  @ApiProperty({
    description: 'context of the verification',
    example: VerificationContext.ACCOUNT_VERIFICATION,
    enum: VerificationContext,
  })
  @IsEnum(VerificationContext, { message: INVALID_VERIFICATION_TYPE })
  context: VerificationContext;
}
