import { ApiProperty } from '@nestjs/swagger';
import { Bookmark } from '../entities/bookmark.entity';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

export class ListBookmarksResponseDto extends EntityListResultDto<Bookmark> {
  @ApiProperty({
    description: 'List of bookmarks with their resource details',
    type: [Bookmark],
    isArray: true,
  })
  items: Bookmark[];
}
