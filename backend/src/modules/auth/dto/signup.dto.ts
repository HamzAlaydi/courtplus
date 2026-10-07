import { NormalizePhone } from 'src/common/phone.transform';
import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  MinLength,
  IsPhoneNumber,
  IsOptional,
  Matches,
  MaxLength,
  IsDate,
  MaxDate,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/modules/users/entities/enums';
import {
  INVALID_CODE,
  INVALID_DATE_OF_BIRTH,
  INVALID_EMAIL,
  INVALID_FIRST_NAME,
  INVALID_GENDER,
  INVALID_LAST_NAME,
  INVALID_PASSWORD,
  INVALID_PHONE_NUMBER,
  INVALID_TOKEN,
  INVALID_USERNAME,
  INVALID_AGE,
} from 'src/modules/shared/error-codes';
import { dayjs } from 'src/modules/shared/dayjs';
export class EmailSignupDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail(undefined, { message: INVALID_EMAIL })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'password123',
    minLength: 8,
  })
  @IsString({ message: INVALID_PASSWORD })
  @MinLength(8, { message: INVALID_PASSWORD })
  password: string;

  @ApiProperty({
    description: 'User first name (minimum 2 characters)',
    example: 'John',
    minLength: 2,
  })
  @IsString({ message: INVALID_FIRST_NAME })
  @MinLength(2, { message: INVALID_FIRST_NAME })
  firstName: string;

  @ApiProperty({
    description: 'User last name (minimum 2 characters)',
    example: 'Doe',
    minLength: 2,
    required: false,
  })
  @IsOptional()
  @IsString({ message: INVALID_LAST_NAME })
  @MinLength(2, { message: INVALID_LAST_NAME })
  lastName?: string;

  @ApiProperty({
    description: 'Token',
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: INVALID_TOKEN })
  @IsNotEmpty({ message: INVALID_TOKEN })
  token?: string;
}

export class PhoneSignupDto {
  @ApiProperty({
    description: 'User phone number, use +201000000000 for testing',
    example: '+201000000000',
  })
  @NormalizePhone()
  @IsPhoneNumber(undefined, { message: INVALID_PHONE_NUMBER })
  phoneNumber: string;

  @ApiProperty({
    description:
      'Verification code (exactly 6 characters), use 123456 for testing',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: INVALID_CODE })
  @Length(6, 6, { message: INVALID_CODE })
  code: string;

  @ApiProperty({
    description: 'User first name (minimum 2 characters)',
    example: 'John',
    minLength: 2,
  })
  @IsString({ message: INVALID_FIRST_NAME })
  @MinLength(2, { message: INVALID_FIRST_NAME })
  firstName: string;

  @ApiProperty({
    description: 'User last name (minimum 2 characters)',
    example: 'Doe',
    minLength: 2,
    required: false,
  })
  @IsOptional()
  @IsString({ message: INVALID_LAST_NAME })
  @MinLength(2, { message: INVALID_LAST_NAME })
  lastName?: string;

  @ApiProperty({
    description:
      'User username (minimum 2 characters, maximum 50 characters, only alphanumeric characters and underscore, dot, dash)',
    example: 'john_doe',
    minLength: 2,
  })
  @IsString({ message: INVALID_USERNAME })
  @MinLength(2, { message: INVALID_USERNAME })
  @MaxLength(50, { message: INVALID_USERNAME })
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: INVALID_USERNAME })
  username: string;

  @ApiProperty({
    description: 'User date of birth (must be at least 14 years old)',
    example: '1990-01-01',
  })
  @IsDate({ message: INVALID_DATE_OF_BIRTH })
  @Transform(({ value }) => new Date(value))
  @MaxDate(() => dayjs().subtract(14, 'year').toDate(), {
    message: INVALID_AGE,
  })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'User gender',
    example: Gender.MALE,
    enum: Gender,
  })
  @IsEnum(Gender, { message: INVALID_GENDER })
  gender: Gender;
}
