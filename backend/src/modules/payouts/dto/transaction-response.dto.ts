import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { BalanceTransaction } from '../entities/balance-transaction.entity';

export class ListTransactionsResponseDto extends EntityListResultDto<BalanceTransaction> {
  @ApiProperty({
    description: 'List of balance transactions',
    type: [BalanceTransaction],
    isArray: true,
  })
  items: BalanceTransaction[];
}
