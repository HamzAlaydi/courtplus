import { ApiProperty } from '@nestjs/swagger';

export class DataPoint {
  @ApiProperty({
    description: 'The x value of the data point',
    example: '2024-01-01',
  })
  x: string;

  @ApiProperty({
    description: 'The y value of the data point',
    example: 100,
  })
  y: number;
}

export class ChartStatsResponseDto {
  @ApiProperty({
    description: 'The data points for the chart',
    type: [DataPoint],
  })
  points: DataPoint[];
}
