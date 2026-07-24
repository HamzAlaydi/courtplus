import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsTimeZone,
  ValidateNested,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { INVALID_TIME_FORMAT } from 'src/modules/shared/error-codes';

export class CreateUpdateScheduleDto {
  @IsTimeZone()
  timeZone: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDto)
  availabilities: AvailabilityDto[];
}

export class AvailabilityDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: INVALID_TIME_FORMAT,
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: INVALID_TIME_FORMAT,
  })
  endTime: string;

  @IsArray()
  @IsNotEmpty()
  @IsNumber(undefined, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days: number[];
}
