import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import type { SessionUser } from '../auth/@types/session';
import { ListPostsDto } from './dto/list-posts.dto';
import { ListPostsResponseDto } from './dto/list-posts-response.dto';
import { Post as PostEntity } from './entities/post.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post in a booking' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostEntity,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant in the booking',
  })
  @ApiResponse({
    status: 403,
    description: 'Explicit content detected in image',
  })
  @AuthorizedUserType.isCustomer()
  async createPost(
    @CurrentUser() user: SessionUser,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.createPost(createPostDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts' })
  @ApiResponse({
    status: 200,
    description: 'Returns posts for a booking, court, user or branch',
    type: [PostEntity],
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant in the booking',
  })
  async getPosts(
    @CurrentUser() user: SessionUser,
    @Query() listPostsDto: ListPostsDto,
  ): Promise<ListPostsResponseDto> {
    return this.postsService.getPosts(listPostsDto, user);
  }

  @Post(':postId/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiResponse({ status: 200, description: 'Post liked successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant in the booking',
  })
  @AuthorizedUserType.isCustomer()
  async likePost(
    @CurrentUser() user: SessionUser,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    return this.postsService.likePost(postId, user.id);
  }

  @Delete(':postId/unlike')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant in the booking',
  })
  @AuthorizedUserType.isCustomer()
  async unlikePost(
    @CurrentUser() user: SessionUser,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    return this.postsService.unlikePost(postId, user.id);
  }

  @Delete(':postId')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized to delete this post',
  })
  @AuthorizedUserType.isCustomer()
  async deletePost(
    @CurrentUser() user: SessionUser,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    return this.postsService.deletePost(postId, user.id);
  }
}
