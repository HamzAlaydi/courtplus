import { Notification } from '../entities/notification.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

export class ListNotificationsResponseDto extends EntityListResultDto<Notification> {
  @ApiProperty({
    type: [Notification],
    isArray: true,
    description: 'List of notifications',
  })
  items: Notification[];
}
