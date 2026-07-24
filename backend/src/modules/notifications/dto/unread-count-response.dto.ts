import { ApiProperty } from '@nestjs/swagger';

export class UnseenCountResponseDto {
  @ApiProperty({
    type: Number,
    description: 'The number of unseen notifications',
  })
  count: number;
}
