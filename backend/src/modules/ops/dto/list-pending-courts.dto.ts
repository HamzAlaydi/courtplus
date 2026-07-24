import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { CourtStatus } from '../../courts/entities/court.entity';

export class ListPendingCourtsDto extends PaginationInputDto {
  @ApiPropertyOptional({
    description: 'Filter the review queue by court status',
    enum: CourtStatus,
    default: CourtStatus.PENDING_APPROVAL,
  })
  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus = CourtStatus.PENDING_APPROVAL;
}
