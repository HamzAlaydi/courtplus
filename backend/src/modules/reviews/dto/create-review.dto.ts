import {
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating score for the court',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Optional comment about the court experience',
    required: false,
    example: 'Great court with good lighting',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;

  @ApiProperty({
    description: 'UUID of the booking being reviewed',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  bookingId: string;
}
