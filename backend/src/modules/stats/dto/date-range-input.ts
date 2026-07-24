import { IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { dayjs } from 'src/modules/shared/dayjs';

export class DateRangeInput {
  @ApiProperty({
    description: 'Start date - MM-DD-YYYY',
    example: '01-01-2024',
  })
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => {
    return value ? dayjs(value).toDate() : dayjs().startOf('month').toDate();
  })
  startDate?: string;

  @ApiProperty({
    description: 'End date - MM-DD-YYYY',
    example: '01-01-2024',
  })
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => {
    return value ? dayjs(value).toDate() : dayjs().endOf('month').toDate();
  })
  endDate?: string;
}
