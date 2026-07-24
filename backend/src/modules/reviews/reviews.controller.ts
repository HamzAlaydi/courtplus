import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Review } from './entities/review.entity';
import { ListReviewsDto } from './dto/list-reviews.dto';
import type { SessionUser } from '../auth/@types/session';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { ListReviewsResponseDto } from './dto/list-reviews-response.dto';

@ApiTags('Reviews')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@Controller('reviews')
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'The review has been successfully created.',
    type: Review,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only users can create reviews.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict. User has already submitted a review for this court.',
  })
  @AuthorizedUserType.isCustomer()
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Review> {
    return this.reviewsService.add(createReviewDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({
    status: 200,
    description: 'Returns all reviews.',
    type: ListReviewsResponseDto,
  })
  @ApiQuery({ type: ListReviewsDto })
  find(
    @Query() query: ListReviewsDto,
    @CurrentUser() user: SessionUser,
  ): Promise<ListReviewsResponseDto> {
    return this.reviewsService.getReviews(query, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({
    status: 200,
    description: 'The review has been successfully deleted.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Only users can delete their own reviews.',
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  @ApiParam({ name: 'id', description: 'The ID of the review to delete' })
  @AuthorizedUserType.isCustomer()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.reviewsService.delete(id, user);
  }
}
