import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  ValidateIf,
  IsLatitude,
  IsLongitude,
  IsEnum,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { CourtStatus } from '../entities/court.entity';
import { SortDirection } from 'src/common/sort';
import { Sport } from 'src/modules/users/entities/enums';

export enum Sort {
  HOURLY_RATE = 'hourlyRate',
  RATING = 'rating',
  NAME = 'name',
}

export class ListCourtsDto extends PaginationInputDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.slice(0, 255))
  @ApiPropertyOptional({ description: 'Search courts by name' })
  search?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Filter courts by branch ID' })
  branchId?: string;

  @IsOptional()
  @IsEnum(Sport, { each: true })
  @Transform(({ value }) => value.split(','))
  @ApiPropertyOptional({
    description: 'Filter courts by sport type',
    example: 'TENNIS,FOOTBALL',
    type: 'string',
  })
  sport?: Sport[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Google Place ID for location-based search',
  })
  placeId?: string;

  @ValidateIf((o) => o.lat !== undefined || o.radius !== undefined)
  @IsLongitude()
  @ApiPropertyOptional({ description: 'Longitude for coordinate-based search' })
  @IsOptional()
  lng?: number;

  @ValidateIf((o) => o.lng !== undefined || o.radius !== undefined)
  @IsLatitude()
  @ApiPropertyOptional({ description: 'Latitude for coordinate-based search' })
  @IsOptional()
  lat?: number;

  @ValidateIf(
    (o) =>
      o.lng !== undefined || o.lat !== undefined || o.placeId !== undefined,
  )
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({
    description:
      'Search radius in meters. Required when using placeId or coordinates',
    minimum: 0,
  })
  @Type(() => Number)
  @IsOptional()
  radius?: number = 5000;

  @IsOptional()
  @IsEnum(CourtStatus)
  @ApiPropertyOptional({
    description: 'Filter courts by status',
    enum: CourtStatus,
  })
  status?: CourtStatus;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Only return air-conditioned courts when true',
    example: true,
  })
  isAirConditioned?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Only return women-only courts when true',
    example: true,
  })
  isWomenOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Filter courts by minimum rating (1-5 stars)',
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
    description: 'Filter courts by exact rating (1-5 stars)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  rating?: number;

  @IsOptional()
  @IsEnum(Sort)
  @ApiPropertyOptional({
    description: 'Sort by',
    enum: Sort,
  })
  sortBy?: Sort;

  @IsOptional()
  @IsEnum(SortDirection)
  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: SortDirection,
  })
  sortDirection?: SortDirection = SortDirection.ASC;

  @ApiPropertyOptional({
    description: 'Start time of the booking (must be current or future date)',
    example: '2024-03-20 14:00',
    required: false,
  })
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'startAt must be in format YYYY-MM-DD HH:mm',
  })
  @IsOptional()
  startAt?: string;

  @ApiPropertyOptional({
    description: 'Duration of the booking in minutes',
    minimum: 30,
    example: 60,
    required: false,
  })
  @IsNumber()
  @Min(30)
  @Type(() => Number)
  @ValidateIf((o) => o.startAt !== undefined)
  duration?: number;
}
