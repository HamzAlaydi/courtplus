import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AssetType } from '../entities/asset.entity';
export class GenerateUrlDto {
  @ApiProperty({
    description: 'The type of the asset',
    enum: AssetType,
    enumName: 'AssetType',
  })
  @IsEnum(AssetType)
  type: AssetType;
}
