import { User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

export class ListUsersResponseDto extends EntityListResultDto<User> {
  @ApiProperty({
    type: [User],
    isArray: true,
    description: 'List of users',
  })
  items: User[];
}
