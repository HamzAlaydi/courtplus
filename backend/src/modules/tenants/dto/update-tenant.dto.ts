import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
export class UpdateTenantDto {
  @ApiProperty({ description: 'The name of the tenant', required: false })
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;
  @ApiProperty({
    description: 'The phone number of the tenant',
    required: false,
  })
  @IsString()
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;
  @ApiProperty({
    description: 'The logo of the tenant',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  logoAssetId?: string;

  @ApiProperty({
    description: 'The documents of the tenant',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documents?: string[];
}
