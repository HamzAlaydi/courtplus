import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestAccountDeletionDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class VerifyAccountDeletionDto {
  @ApiProperty({
    description: 'Verification code sent to email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
