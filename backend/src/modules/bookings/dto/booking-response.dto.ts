import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Whether to accept or reject the booking participation',
  })
  @IsBoolean()
  accept: boolean;

  @ApiProperty({
    description: 'The reason for rejecting the booking participation',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.accept)
  rejectionReason?: string;
}
