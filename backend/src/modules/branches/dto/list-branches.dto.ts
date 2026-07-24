import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  ValidateIf,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationInputDto } from 'src/common/pagination.input.dto';

export class ListBranchesDto extends PaginationInputDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.slice(0, 255))
  @ApiPropertyOptional({ description: 'The search query' })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Google Place ID for location-based search',
  })
  placeId?: string;

  @IsOptional()
  @IsLongitude()
  @ApiPropertyOptional({ description: 'Longitude for coordinate-based search' })
  lng?: number;

  @IsOptional()
  @IsLatitude()
  @ApiPropertyOptional({ description: 'Latitude for coordinate-based search' })
  lat?: number;

  @ValidateIf(
    (o) =>
      o.lng !== undefined || o.lat !== undefined || o.placeId !== undefined,
  )
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    description:
      'Search radius in meters. Required when using placeId or coordinates',
    minimum: 0,
    default: 10000,
  })
  radius?: number = 10000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Filter branches by minimum rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Filter branches by exact rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  rating?: number;
}
