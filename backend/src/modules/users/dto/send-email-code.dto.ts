import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { INVALID_EMAIL } from 'src/modules/shared/error-codes';

export class SendEmailCodeDto {
  @ApiProperty({
    description: 'User email',
    example: 'test@example.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  email?: string;
}
