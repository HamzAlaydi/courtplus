import {
  IsNumber,
  IsUUID,
  IsArray,
  IsEnum,
  Min,
  IsBoolean,
  IsOptional,
  ValidateIf,
  Matches,
  Max,
  ArrayUnique,
} from 'class-validator';
import { PaymentType } from 'src/modules/payments/entities/payment.entity';
import { ApiProperty } from '@nestjs/swagger';
import { SportLevel, Gender } from 'src/modules/users/entities/enums';
import { BOOKING } from '../booking.constants';

export class CreateBookingDto {
  @ApiProperty({
    description: 'UUID of the court where the booking will be played',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  courtId?: string;

  @ApiProperty({
    description: 'Start time of the booking (must be current or future date)',
    example: '2024-03-20 14:00',
    required: false,
  })
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'startAt must be in format YYYY-MM-DD HH:mm',
  })
  startAt?: string;

  @ApiProperty({
    description: 'Duration of the booking in minutes',
    minimum: 30,
    example: 60,
    required: false,
  })
  @IsNumber()
  @Min(BOOKING.MIN_DURATION_MINUTES)
  duration?: number;

  @ApiProperty({
    description: 'Array of participant UUIDs for the booking',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ValidateIf((o) => !o.open)
  @IsOptional()
  @ArrayUnique()
  participants?: string[];

  @ApiProperty({
    description: 'Open to all participants',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  open?: boolean;

  @ApiProperty({
    description: 'Type of payment for the booking',
    enum: PaymentType,
    example: PaymentType.WHOLE,
  })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({
    description: 'Number of players on each side of the booking',
    minimum: 1,
    maximum: 2,
    example: 2,
    required: true,
  })
  @IsNumber()
  @Min(BOOKING.MIN_PLAYERS_PER_SIDE)
  @Max(BOOKING.MAX_PLAYERS_PER_SIDE)
  @ValidateIf((o) => o.open)
  playersASide?: number;

  @ApiProperty({
    description: 'Whether to auto-accept join requests',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @ValidateIf((o) => o.open)
  autoAccept?: boolean;

  @ApiProperty({
    description:
      'Gender restriction for the booking (only applicable when open is true)',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsEnum(Gender)
  @ValidateIf((o) => o.open)
  gender?: Gender;

  @ApiProperty({
    description:
      'Skill level restriction for the booking (only applicable when open is true)',
    enum: SportLevel,
    example: SportLevel.INTERMEDIATE,
    required: false,
  })
  @IsEnum(SportLevel)
  @ValidateIf((o) => o.open)
  level?: SportLevel;
}
