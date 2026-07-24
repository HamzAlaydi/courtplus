import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { BookmarkDto } from './dto/bookmark.dto';
import {
  ApiBearerAuth,
  ApiHeaders,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import type { SessionUser } from '../auth/@types/session';
import { Bookmark } from './entities/bookmark.entity';
import { ListBookmarksResponseDto } from './dto/list-bookmarks-response.dto';
import { ListBookmarksDto } from './dto/list-bookmarks.dto';
import { Location, UserLocation } from 'src/decorators/location.decorator';
@Controller('bookmarks')
@ApiTags('Bookmarks')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@AuthorizedUserType.isCustomer()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bookmark' })
  @ApiResponse({
    status: 200,
    description: 'The bookmark has been successfully created.',
    type: Bookmark,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '98765432-e89b-12d3-a456-426614174000',
      resourceId: '11112222-e89b-12d3-a456-426614174000',
      resourceType: 'court',
      createdAt: '2021-01-01T00:00:00.000Z',
      updatedAt: '2021-01-01T00:00:00.000Z',
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(
    @Body() createBookmarkDto: BookmarkDto,
    @CurrentUser() user: SessionUser,
  ) {
    return this.bookmarksService.create(createBookmarkDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarks' })
  @ApiResponse({
    status: 200,
    description: 'The bookmarks have been successfully retrieved.',
    type: ListBookmarksResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiHeaders([
    {
      name: 'X-Location',
      description: 'The location of the user',
      example: '40.7128,-74.006',
      required: false,
    },
  ])
  list(
    @Query() query: ListBookmarksDto,
    @Location() location: UserLocation,
    @CurrentUser() user: SessionUser,
  ) {
    return this.bookmarksService.list(query, user, location);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bookmark' })
  @ApiResponse({
    status: 200,
    description: 'The bookmark has been successfully deleted.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ) {
    const deleted = await this.bookmarksService.delete(id, user.id);

    return { deleted };
  }
}
