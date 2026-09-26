import { ApiProperty } from '@nestjs/swagger';

export class Slot {
  // Working hours may cross midnight (18:00-02:00), so a slot generated for
  // one opening day can actually start on the NEXT calendar day. startTime is
  // a bare "HH:mm", which cannot tell 01:00 tomorrow from 01:00 today, so the
  // date the slot really starts on is reported alongside it.
  @ApiProperty({
    example: '2026-10-04',
    description:
      'Calendar date (YYYY-MM-DD, in the schedule timezone) the slot starts on. For working hours that cross midnight this is the day AFTER the opening day.',
  })
  date: string;

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
