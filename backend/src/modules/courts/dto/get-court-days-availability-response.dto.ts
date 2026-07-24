import { ApiProperty } from '@nestjs/swagger';

export class GetCourtAvailableDaysResponseDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of available days',
    example: [10, 12, 15],
  })
  availableDays: number[];

  @ApiProperty({
    type: [Number],
    description: 'Array of unavailable days',
    example: [11, 13, 14],
  })
  unavailableDays: number[];
}
