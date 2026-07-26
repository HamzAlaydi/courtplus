import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { SortDirection } from 'src/common/sort';

export enum UsersSortBy {
  Spending = 'spending',
  Bookings = 'bookings',
  Reviews = 'reviews',
  Followers = 'followers',
  Following = 'following',
  Minutes = 'minutes',
}

export class ListUsersDto extends PaginationInputDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'John Doe',
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
    description: 'Sort by',
    example: UsersSortBy.Spending,
    enum: UsersSortBy,
  })
  sortBy?: UsersSortBy;

  @IsEnum(SortDirection)
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Sort order',
    example: SortDirection.DESC,
    enum: SortDirection,
  })
  sortOrder?: SortDirection;
}
