import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class RequestPayoutDto {
  // MAJOR units (e.g. 250 = 250.00 SAR): the balance, the ledger and the
  // minimum are all in major units; the provider converts to minor units.
  // The DTO used to say "cents" with a min of 100, so 5000 (= 50.00) was
  // compared against a 400.00 balance and refused as insufficient.
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @ApiProperty({
    description: 'Amount in major currency units (e.g. 250 = 250.00 SAR); minimum 100',
    example: 250,
    minimum: 1,
  })
  amount: number;
}
