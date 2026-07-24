import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { BookingEvent } from '../entities/event.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ListBookingEventsResponseDto extends EntityListResultDto<BookingEvent> {
  @ApiProperty({
    description: 'The list of booking events',
    type: [BookingEvent],
  })
  items: BookingEvent[];
}
