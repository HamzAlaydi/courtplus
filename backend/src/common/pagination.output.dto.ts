import { ApiProperty } from '@nestjs/swagger';

export class PaginationOutput {
  @ApiProperty({ description: 'Total number of items' })
  totalCount: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;
}
