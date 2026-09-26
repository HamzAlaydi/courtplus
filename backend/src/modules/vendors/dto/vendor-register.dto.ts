import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Public vendor-registration payload from the marketing site.
 *
 * Deliberately NOT an extension of ContactMessageDto: the FAQs support form
 * posts to POST /contact with that DTO, so widening it would change the shape
 * of an unrelated endpoint.
 */
export class VendorRegisterDto {
  @ApiProperty({ example: 'Hamza', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  firstName: string;

  @ApiPropertyOptional({ example: 'Alaydi', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  lastName?: string;

  @ApiProperty({ example: 'Hamza Playground', maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  facilityName: string;

  @ApiProperty({ example: 'owner@facility.com' })
  @IsEmail()
  // Normalised so the account lookup, the rate-limit key and the uniqueness
  // check all agree on one form of the address.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({ example: '+966501234567', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Riyadh', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;
}
