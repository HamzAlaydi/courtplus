import { ApiProperty } from '@nestjs/swagger';

export class MonthStats {
  @ApiProperty({
    description: 'Total revenue for the current month',
    example: 2500.50,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Number of upcoming bookings in the current month',
    example: 15,
  })
  upcomingBookings: number;

  @ApiProperty({
        description: 'Total number of bookings in the current month',
    example: 23,
  })
  totalBookings: number;
} 