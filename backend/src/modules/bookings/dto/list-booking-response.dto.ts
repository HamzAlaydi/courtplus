import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Booking } from '../entities/booking.entity';
import { ApiProperty } from '@nestjs/swagger';
export class ListBookingsResponseDto extends EntityListResultDto<Booking> {
  @ApiProperty({
    description: 'List of bookings',
    type: [Booking],
  })
  items: Booking[];
}
