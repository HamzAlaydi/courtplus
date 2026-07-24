import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { Transform } from 'class-transformer';

export class ListTenantsDto extends PaginationInputDto {
  @ApiPropertyOptional({
    description: 'Search by tenant name',
    example: 'Sports Complex',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  blocked?: boolean;
}

export class ListTenantsResponseDto extends EntityListResultDto<Tenant> {
  @ApiProperty({ type: [Tenant] })
  items: Tenant[];
}
