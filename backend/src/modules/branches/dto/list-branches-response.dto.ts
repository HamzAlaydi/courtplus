import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Branch } from '../entities/branch.entity';

export class ListBranchesResponseDto extends EntityListResultDto<Branch> {
  @ApiProperty({
    description: 'List of branches',
    type: [Branch],
    isArray: true,
  })
  items: Branch[];
}
