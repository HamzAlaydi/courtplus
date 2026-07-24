import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsPhoneNumber } from 'class-validator';
import { INVALID_PHONE_NUMBER } from 'src/modules/shared/error-codes';
export class SendPhoneCodeDto {
  @ApiProperty({
    description: 'User phone number, use +201000000000 for testing',
    example: '+201000000000',
  })
  @IsPhoneNumber(undefined, { message: INVALID_PHONE_NUMBER })
  phoneNumber: string;

  @ApiPropertyOptional({
    description:
      'Purpose of the verification code. "login" requires an existing account, "signup" requires the phone number to be available.',
    enum: ['login', 'signup'],
  })
  @IsOptional()
  @IsIn(['login', 'signup'])
  purpose?: 'login' | 'signup';
}
