import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsPhoneNumber,
  IsBoolean,
  MinLength,
  IsOptional,
  IsObject,
  ValidateNested,
  ValidateIf,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { BranchStatus } from '../entities/branch.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUpdateScheduleDto } from 'src/modules/schedules/dto/create-update-schedule.dto';
import { Type } from 'class-transformer';

export class CoordinatesDto {
  @ApiProperty({
    description: 'Latitude',
    example: 40.7128,
  })
  @IsLatitude()
  lat: number;

  @ApiProperty({
    description: 'Longitude',
    example: -74.0060,
  })
  @IsLongitude()
  lng: number;
}

export class CreateBranchDto {
  @ApiProperty({
    description: 'The name of the branch',
    example: 'Downtown Branch',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    description: 'The phone number of the branch',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({
    description: 'The location ID of the branch (required if coordinates not provided)',
    example: 'place123',
    required: false,
  })
  @ValidateIf((o) => !o.coordinates)
  @IsNotEmpty()
  @IsString()
  placeId?: string;

  @ApiProperty({
    description: 'Direct coordinates for the branch location (required if placeId not provided)',
    example: { lat: 40.7128, lng: -74.0060 },
    required: false,
    type: () => CoordinatesDto,
  })
  @ValidateIf((o) => !o.placeId)
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @ApiProperty({
    description: 'The address of the branch (required when using coordinates)',
    example: '123 Main St, New York, NY 10001',
    required: false,
  })
  @ValidateIf((o) => o.coordinates && !o.placeId)
  @IsNotEmpty()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'The current operational status of the branch',
    enum: BranchStatus,
    example: BranchStatus.OPEN,
    enumName: 'BranchStatus',
  })
  @IsNotEmpty()
  @IsEnum(BranchStatus)
  status: BranchStatus;

  @ApiProperty({
    description: 'The visibility of the branch',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  isVisible: boolean;

  @ApiProperty({
    description: 'The cover asset of the branch',
    example: 'asset123',
  })
  @IsOptional()
  @IsString()
  coverAssetId?: string;

  @ApiProperty({
    description: 'The logo asset of the branch',
    example: 'asset123',
  })
  @IsOptional()
  @IsString()
  logoAssetId?: string;

  @ApiProperty({
    description: 'The schedule of the branch',
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
