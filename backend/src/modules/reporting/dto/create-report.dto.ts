import { IsEnum, IsString, IsUUID, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportEntity } from '../entities/report.entity';

export class CreateReportDto {
  @ApiProperty({
    description: 'UUID of the entity being reported',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entityId: string;

  @ApiProperty({
    description: 'Type of the entity being reported',
    enum: ReportEntity,
    example: ReportEntity.USER,
  })
  @IsEnum(ReportEntity)
  entity: ReportEntity;

  @ApiProperty({
    description: 'Reason for reporting',
    example: 'Abusive behavior',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
    example: 'User was using inappropriate language during the booking.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
