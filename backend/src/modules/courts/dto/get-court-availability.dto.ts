import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, ValidateIf } from 'class-validator';
export class GetCourtAvailabilityDto {
  @ApiProperty({
    description:
      'The date to get availability for (must be current or future date)',
    example: '2024-03-20',
    required: false,
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  @ValidateIf((object) => !object.month)
  date?: string;

  @ApiProperty({
    description:
      'The month and year to check for available days in YYYY-MM format',
    example: '2024-06',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Month must be in YYYY-MM format',
  })
  @ValidateIf((object) => !object.date)
  month?: string;
}
