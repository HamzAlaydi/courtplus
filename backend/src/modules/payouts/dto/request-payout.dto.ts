import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class RequestPayoutDto {
  @IsNumber()
  @Min(100)
  @ApiProperty({
    description: 'Amount in smallest currency unit (e.g. cents)',
    example: 5000,
    minimum: 100,
  })
  amount: number;
}
