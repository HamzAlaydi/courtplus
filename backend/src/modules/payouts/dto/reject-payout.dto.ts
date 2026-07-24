import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectPayoutDto {
  @IsString()
  @ApiProperty({ description: 'Reason for rejection' })
  reason: string;
}
