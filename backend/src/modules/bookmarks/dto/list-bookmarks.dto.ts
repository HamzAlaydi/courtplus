import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookmarkType } from '../entities/bookmark.entity';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { Transform } from 'class-transformer';

export class ListBookmarksDto extends PaginationInputDto {
  @ApiPropertyOptional({
    description: 'Filter bookmarks by type',
    enum: BookmarkType,
  })
  @IsOptional()
  @IsEnum(BookmarkType, { each: true })
  @Transform(({ value }) => value.split(','))
  types?: BookmarkType[];

  @ApiPropertyOptional({
    description: 'Optional search string to filter bookmarks',
    example: 'tennis',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
