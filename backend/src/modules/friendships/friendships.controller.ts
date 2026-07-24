import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Friendship } from './entities/friendship.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListFriendshipsDto } from './dto/list-friendships.dto';
import { ListFriendshipsResponseDto } from './dto/list-friendships-response.dto';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';

@Controller('friendships')
@ApiTags('Friendships')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@AuthorizedUserType.isCustomer()
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) { }

  @Post('/:id/follow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({
    status: 200,
    description: 'The friendship has been successfully created.',
    type: Friendship,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  follow(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Friendship> {
    return this.friendshipsService.follow(id, user);
  }

  @Get()
  @ApiOperation({ summary: 'List followers or following users' })
  @ApiResponse({
    status: 200,
    description: 'The friendships have been successfully retrieved.',
    type: ListFriendshipsResponseDto,
  })
  find(
    @Query() query: ListFriendshipsDto,
    @CurrentUser() user: SessionUser,
  ): Promise<ListFriendshipsResponseDto> {
    return this.friendshipsService.find(query, user);
  }

  @Post(':id/unfollow')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({
    status: 200,
    description: 'The friendship has been successfully removed.',
  })
  @ApiResponse({ status: 404, description: 'Friendship not found.' })
  @ApiParam({ name: 'id', description: 'The ID of the user to unfollow' })
  unfollow(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.friendshipsService.unfollow(id, user);
  }
}
