import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsNumber,
  IsUUID,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { CourtStatus, CourtSurface } from '../entities/court.entity';
import { CreateUpdateScheduleDto } from 'src/modules/schedules/dto/create-update-schedule.dto';
import { CoordinatesDto } from 'src/modules/branches/dto/create-branch.dto';
import { Type } from 'class-transformer';
import { Sport } from 'src/modules/users/entities/enums';
export class CreateCourtDto {
  @ApiProperty({
    description: 'The name of the court',
    example: 'Center Court',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The ID of the branch this court belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    description: 'The status of the court',
    enum: CourtStatus,
    enumName: 'CourtStatus',
    example: CourtStatus.AVAILABLE,
  })
  @IsEnum(CourtStatus)
  status: CourtStatus;

  @ApiProperty({
    description: 'The image assets of the court',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({
    description: 'The video of the court',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  videoAssetId?: string;

  @ApiProperty({
    description:
      'The ID of the place this court belongs to (free-text place search). Optional when address + coordinates are provided.',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiProperty({
    description: 'Display name of the place (used with coordinates)',
    required: false,
  })
  @IsString()
  @IsOptional()
  placeName?: string;

  @ApiProperty({
    description: 'Formatted address of the place (used with coordinates)',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Lat/lng of the place (used with address)',
    required: false,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;

  @ApiProperty({ description: 'The length of the court', example: 23.77 })
  @IsNumber()
  @IsNotEmpty()
  length: number;

  @ApiProperty({ description: 'The width of the court', example: 10.97 })
  @IsNumber()
  @IsNotEmpty()
  width: number;

  @ApiProperty({
    description: 'The surface of the court',
    enum: CourtSurface,
    enumName: 'CourtSurface',
    example: CourtSurface.HARD,
  })
  @IsEnum(CourtSurface)
  surface: CourtSurface;

  @ApiProperty({ description: 'The size of the court', example: 'Standard' })
  @IsOptional()
  size?: string;

  @ApiProperty({ description: 'The hourly rate of the court', example: 100 })
  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @ApiProperty({
    description: 'The sport of the court',
    enum: Sport,
    enumName: 'Sport',
    example: Sport.TENNIS,
  })
  @IsEnum(Sport)
  @IsNotEmpty()
  sport: Sport;

  @ApiProperty({
    description: 'The schedule of the court',
    type: CreateUpdateScheduleDto,
    example: {
      timeZone: 'America/New_York',
      availabilities: [
        {
          days: [1, 2, 3, 4, 5, 6, 7],
          startTime: '09:00',
          endTime: '17:00',
        },
      ],
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CreateUpdateScheduleDto)
  schedule: CreateUpdateScheduleDto;
}
