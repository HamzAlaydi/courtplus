import { Block } from '../entities/block.entity';
import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';

export class ListBlocksResponseDto extends EntityListResultDto<Block> {
  @ApiProperty({
    description: 'List of blocked users',
    type: [Block],
    isArray: true,
  })
  items: Block[];
}
