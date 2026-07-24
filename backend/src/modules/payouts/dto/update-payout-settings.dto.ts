import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdatePayoutSettingsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Bank name' })
  bankName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Account holder name' })
  accountHolderName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'IBAN' })
  iban?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Account number' })
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sort code / routing number' })
  sortCode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'SWIFT/BIC code' })
  swiftCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code', example: 'US' })
  bankCountry?: string;
}
