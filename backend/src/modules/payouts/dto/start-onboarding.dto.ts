import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class StartOnboardingDto {
  @ApiPropertyOptional({
    description:
      'ISO 3166-1 alpha-2 country of the venue business (default: PAYOUTS_DEFAULT_COUNTRY)',
    example: 'SA',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}
