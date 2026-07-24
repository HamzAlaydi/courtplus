import { IsEnum } from 'class-validator';
import { SportLevel, TimePreference, Sport } from '../entities/enums';
import { ApiProperty } from '@nestjs/swagger';
import {
  INVALID_SPORT_LEVEL,
  INVALID_TIME_PREFERENCE,
  INVALID_SPORT_NAME,
} from 'src/modules/shared/error-codes';

export class UpsertSportDto {
  @ApiProperty({
    description: 'The name of the sport',
    example: Sport.FOOTBALL,
    enum: Sport,
  })
  @IsEnum(Sport, {
    message: INVALID_SPORT_NAME,
  })
  name: Sport;

  @IsEnum(SportLevel, {
    message: INVALID_SPORT_LEVEL,
  })
  @ApiProperty({
    description: 'The level of the sport',
    example: SportLevel.BEGINNER,
    enum: SportLevel,
  })
  level: SportLevel;

  @IsEnum(TimePreference, {
    message: INVALID_TIME_PREFERENCE,
  })
  @ApiProperty({
    description: 'The time preference of the sport',
    example: TimePreference.MORNING,
  })
  timePreference: TimePreference;
}
