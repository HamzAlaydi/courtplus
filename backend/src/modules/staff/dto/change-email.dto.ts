import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
  })
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
