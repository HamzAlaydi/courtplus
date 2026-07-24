import { Post } from '../entities/post.entity';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { ApiProperty } from '@nestjs/swagger';
export class ListPostsResponseDto extends EntityListResultDto<Post> {
  @ApiProperty({
    type: [Post],
    isArray: true,
    description: 'The list of posts',
  })
  items: Post[];
}
