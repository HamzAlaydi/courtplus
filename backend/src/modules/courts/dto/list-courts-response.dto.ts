import { ApiProperty } from '@nestjs/swagger';
import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Court } from '../entities/court.entity';

export class ListCourtsResponseDto extends EntityListResultDto<Court> {
  @ApiProperty({
    description: 'List of courts',
    type: [Court],
    isArray: true,
  })
  items: Court[];
}
