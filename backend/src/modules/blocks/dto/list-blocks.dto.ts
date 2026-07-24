import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';

export class ListBlocksDto extends PaginationInputDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Search query to filter blocked users by name or username',
    example: 'John',
    required: false,
  })
  search?: string;
}
