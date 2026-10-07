import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  INVALID_EMAIL,
  INVALID_PASSWORD,
} from 'src/modules/shared/error-codes';

/**
 * Lets someone who mistyped their address during signup correct it while the
 * account is still unverified. Ownership is re-proved with the password they
 * just chose, which is the only credential they have — an unverified staffer
 * is never issued a JWT, so every authenticated email-change endpoint is out
 * of reach for them.
 */
export class ChangeUnverifiedEmailDto {
  @ApiProperty({
    description: 'The address the account was created with (possibly mistyped)',
    example: 'owner@gmai.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'The password chosen at signup, proving the account is theirs',
    minLength: 8,
  })
  @IsString({ message: INVALID_PASSWORD })
  @MinLength(8, { message: INVALID_PASSWORD })
  password: string;

  @ApiProperty({
    description: 'The corrected address the verification code should go to',
    example: 'owner@gmail.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => String(value ?? '').toLowerCase().trim())
  newEmail: string;
}
