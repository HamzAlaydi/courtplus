import { IsUUID, IsOptional } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListPostsDto extends PaginationInputDto {
  @ApiPropertyOptional({
    description: 'The ID of the booking to list posts for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Optional: Filter posts by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Optional: Filter posts by court ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  courtId?: string;

  @ApiPropertyOptional({
    description: 'Optional: Filter posts by branch ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  branchId?: string;
}
