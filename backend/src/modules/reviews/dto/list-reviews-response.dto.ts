import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Review } from '../entities/review.entity';
import { ApiProperty } from '@nestjs/swagger';
export class ListReviewsResponseDto extends EntityListResultDto<Review> {
  @ApiProperty({
    description: 'List of reviews',
    type: [Review],
  })
  items: Review[];
}
