import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  // Login, signup and forgot-password all lowercase the address. Storing the
  // new one as typed meant a staffer who entered "Owner@Venue.com" could no
  // longer sign in with it afterwards.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class VerifyEmailChangeDto {
  @ApiProperty({
    description: 'Verification code sent to new email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
