import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsISO4217CurrencyCode } from 'class-validator';

export class UpdateTenantPreferencesDto {
  @ApiProperty({
    description: 'The currency code for the tenant (ISO 4217)',
    example: 'USD',
    required: false,
  })
  @IsString()
  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string;
}
