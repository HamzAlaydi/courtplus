import { ApiProperty } from '@nestjs/swagger';
import { ChartStatsResponseDto } from './chart-stats-response.dto';

export class TenantStatsDto {
  @ApiProperty({
    description: 'Total revenue for the tenant',
    example: 1500.5,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Number of upcoming matches',
    example: 5,
  })
  upcomingBookings: number;

  @ApiProperty({
    description: 'Total number of matches',
    example: 25,
  })
  totalBookings: number;

  @ApiProperty({
    description: 'Revenue stats',
    type: ChartStatsResponseDto,
  })
  revenueChart: ChartStatsResponseDto;

  @ApiProperty({
    description: 'Reviews stats',
    type: ChartStatsResponseDto,
  })
  reviewsChart: ChartStatsResponseDto;

  @ApiProperty({
    description: 'Pending matches stats',
    type: ChartStatsResponseDto,
  })
  upcomingBookingsChart: ChartStatsResponseDto;

  @ApiProperty({
    description: 'Total matches stats',
    type: ChartStatsResponseDto,
  })
  totalBookingsChart: ChartStatsResponseDto;
}
