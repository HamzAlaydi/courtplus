import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class MarkPayoutSentDto {
  @ApiPropertyOptional({
    description: 'Bank reference for the transfer, stored for reconciliation',
    example: 'TRF-2026-00184',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}
