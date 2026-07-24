import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportEntity, ReportStatus } from '../entities/report.entity';
import { PaginationInputDto } from 'src/common/pagination.input.dto';

export class ListReportsDto extends PaginationInputDto {
  @ApiPropertyOptional({ description: 'UUID of the reporter' })
  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @ApiPropertyOptional({ description: 'UUID of the reported entity' })
  @IsUUID()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Type of the reported entity',
    enum: ReportEntity,
  })
  @IsEnum(ReportEntity)
  @IsOptional()
  entityType?: ReportEntity;

  @ApiPropertyOptional({
    description: 'Status of the report',
    enum: ReportStatus,
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;
}
