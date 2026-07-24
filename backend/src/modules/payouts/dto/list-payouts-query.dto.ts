import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { PayoutStatus } from '../constants/payout.constants';

export class ListPayoutsQueryDto extends PaginationInputDto {
  @IsOptional()
  @IsEnum(PayoutStatus)
  @ApiProperty({ enum: PayoutStatus, required: false })
  status?: PayoutStatus;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;
}
