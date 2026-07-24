import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { LogAction, LogEntity } from '../../logging/entities/log.entity';

export class ListOpsLogsDto extends PaginationInputDto {
  @ApiPropertyOptional({
    description: 'Filter by actor staff id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  actorStaffId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor email (partial match)' })
  @IsOptional()
  @IsString()
  actorEmail?: string;

  @ApiPropertyOptional({ enum: LogEntity })
  @IsOptional()
  @IsEnum(LogEntity)
  entity?: LogEntity;

  @ApiPropertyOptional({ enum: LogAction })
  @IsOptional()
  @IsEnum(LogAction)
  action?: LogAction;

  @ApiPropertyOptional({
    description: 'Only logs created at or after this ISO date',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Only logs created at or before this ISO date',
    example: '2026-07-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
