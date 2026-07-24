import { IsDate, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { Transform, Type } from 'class-transformer';
import { dayjs } from 'src/modules/shared/dayjs';

export class ListReviewsDto extends PaginationInputDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'The id of the user' })
  userId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'The id of the court' })
  courtId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'The id of the booking' })
  bookingId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'The id of the branch' })
  branchId?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'The rating of the review' })
  rating?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => dayjs(value).utc().startOf('day').toDate())
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => dayjs(value).utc().endOf('day').toDate())
  @Type(() => Date)
  endDate?: Date;
}
