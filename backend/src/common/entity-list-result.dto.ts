import { ApiProperty } from '@nestjs/swagger';
import { PaginationOutput } from './pagination.output.dto';

export class EntityListResultDto<T> {
  @ApiProperty({ description: 'List of items', isArray: true })
  items: T[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationOutput,
  })
  pagination: PaginationOutput;
}
