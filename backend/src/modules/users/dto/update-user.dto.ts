import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxDate,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '../entities/enums';
import { Type, Transform } from 'class-transformer';
import { MAX_LENGTH_EXCEEDED, INVALID_USERNAME, INVALID_AGE } from 'src/modules/shared/error-codes';
import { dayjs } from 'src/modules/shared/dayjs';
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @MaxLength(100, { message: MAX_LENGTH_EXCEEDED })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @MaxLength(100, { message: MAX_LENGTH_EXCEEDED })
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The bio of the user',
    example: 'I am a software engineer',
  })
  @MaxLength(1000, { message: MAX_LENGTH_EXCEEDED })
  bio?: string;

  @IsOptional()
  @IsEnum(Gender)
  @ApiProperty({
    description: 'The gender of the user',
    example: Gender.MALE,
    enum: Gender,
  })
  gender?: Gender;

  @IsOptional()
  @IsDate()
  @ApiProperty({
    description: 'The date of birth of the user (must be at least 14 years old)',
    example: '1990-01-01',
  })
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  @MaxDate(() => dayjs().subtract(14, 'year').toDate(), {
    message: INVALID_AGE,
  })
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The username of the user',
    example: 'john_doe',
  })
  @MinLength(3, { message: INVALID_USERNAME })
  @MaxLength(50, { message: INVALID_USERNAME })
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: INVALID_USERNAME })
  username?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'The avatar asset id of the user',
    example: '123',
  })
  avatarAssetId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'The cover asset id of the user',
    example: '123',
  })
  coverAssetId?: string;
}
