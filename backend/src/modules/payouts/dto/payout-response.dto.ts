import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Payout } from '../entities/payout.entity';

export class ListPayoutsResponseDto extends EntityListResultDto<Payout> {
  @ApiProperty({
    description: 'List of payouts',
    type: [Payout],
    isArray: true,
  })
  items: Payout[];
}
