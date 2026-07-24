import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { SortDirection } from 'src/common/sort';
import { UsersSortBy } from 'src/modules/users/dto/list-users.dto';

export class AdminListUsersDto extends PaginationInputDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search by name, email, or username',
    example: 'john',
  })
  search?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: false,
  })
  blocked?: boolean;

  @IsEnum(UsersSortBy)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: UsersSortBy,
  })
  sortBy?: UsersSortBy;

  @IsEnum(SortDirection)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: SortDirection,
    default: SortDirection.DESC,
  })
  sortOrder?: SortDirection = SortDirection.DESC;
}


