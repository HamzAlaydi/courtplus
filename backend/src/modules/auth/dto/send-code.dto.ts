import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';
import { INVALID_PHONE_NUMBER } from 'src/modules/shared/error-codes';
export class SendPhoneCodeDto {
  @ApiProperty({
    description: 'User phone number, use +201000000000 for testing',
    example: '+201000000000',
  })
  @IsPhoneNumber(undefined, { message: INVALID_PHONE_NUMBER })
  phoneNumber: string;
}
