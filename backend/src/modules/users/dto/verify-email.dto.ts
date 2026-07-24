import { IsEmail } from 'class-validator';

import { INVALID_EMAIL } from 'src/modules/shared/error-codes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { INVALID_CODE } from 'src/modules/shared/error-codes';

export class VerifyUpdateEmailCodeDto {
  @ApiProperty({
    description: 'email address',
    example: 'test@test.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  email?: string;

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
