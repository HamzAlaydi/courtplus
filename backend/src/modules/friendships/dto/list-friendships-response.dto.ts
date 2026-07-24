import { Friendship } from '../entities/friendship.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

export class ListFriendshipsResponseDto extends EntityListResultDto<Friendship> {
  @ApiProperty({
    description: 'List of friendships',
    type: [Friendship],
    isArray: true,
  })
  items: Friendship[];
}
