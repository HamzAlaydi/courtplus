import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { BookmarkType } from '../entities/bookmark.entity';

export class BookmarkDto {
  @ApiProperty({
    description: 'The ID of the resource to bookmark',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  resourceId: string;

  @ApiProperty({
    description: 'The type of resource to bookmark',
    enum: BookmarkType,
    example: BookmarkType.COURT,
  })
  @IsEnum(BookmarkType)
  type: BookmarkType;
}
