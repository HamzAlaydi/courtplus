import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { StaffRole } from '../entities/enum';

export class ListStaffDto extends PaginationInputDto {
  @ApiProperty({
    description: 'Filter staff by role',
    enum: StaffRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiProperty({
    description: 'Optional search string to filter staff',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter staff by branch id',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
