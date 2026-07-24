import { ApiProperty } from '@nestjs/swagger';

export class Slot {
  @ApiProperty({
    example: '09:00',
    description: 'Start time of the slot in HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    example: '10:00',
    description: 'End time of the slot in HH:mm format',
  })
  endTime: string;

  @ApiProperty({ example: false, description: 'Whether the slot is reserved' })
  available: boolean;
}

export class SlotsResponse {
  @ApiProperty({ type: [Slot], description: 'Array of available slots' })
  slots: Slot[];
}
