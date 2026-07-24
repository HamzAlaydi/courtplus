import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { INVALID_EMAIL } from 'src/modules/shared/error-codes';
export class SendVerificationCodeDto {
  @ApiProperty({
    description: 'Email address associated with the account',
    example: 'user@example.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}
