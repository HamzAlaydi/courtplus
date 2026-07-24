import { ApiProperty } from '@nestjs/swagger';

export class MonthStats {
  @ApiProperty({
    description: 'Total revenue for the current month',
    example: 2500.50,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Number of upcoming matches in the current month',
    example: 15,
  })
  upcomingMatches: number;

  @ApiProperty({
    description: 'Total number of matches in the current month',
    example: 23,
  })
  totalMatches: number;
} 