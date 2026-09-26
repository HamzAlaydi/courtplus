import {
  Controller,
  Body,
  Patch,
  Param,
  UseGuards,
  Post,
  Get,
  Query,
  ParseUUIDPipe,
  Sse,
  Req,
} from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { SaveTokenDto } from './dto/save-token.dto';
import { ListNotificationsResponseDto } from './dto/list-notifications-response.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { UnseenCountResponseDto } from './dto/unread-count-response.dto';
@ApiTags('Notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) { }

  @Get('/')
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({
    status: 200,
    description: 'The notifications have been successfully retrieved.',
    type: ListNotificationsResponseDto,
  })
  find(
    @CurrentUser() user: SessionUser,
    @Query() query: ListNotificationsDto,
  ): Promise<ListNotificationsResponseDto> {
    return this.notificationsService.list(query, user);
  }
  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been successfully marked as read.',
  })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'Every unread notification is now read.' })
  markAllAsRead(
    @CurrentUser() user: SessionUser,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAllAsRead(user);
  }

  @Post('mark-seen')
  @ApiOperation({ summary: 'Mark all notifications as seen' })
  @ApiResponse({
    status: 200,
    description: 'The notifications have been successfully marked as seen.',
  })
  markAllAsSeen(@CurrentUser() user: SessionUser): Promise<void> {
    return this.notificationsService.markAllAsSeen(user);
  }

  /**
   * text/event-stream. Auth is the normal Bearer header (clients use fetch,
   * not EventSource, so no token ever lands in a URL). Events: `count`
   * {unseenCount}, `notification` {unseenCount, notification}, `ping`.
   */
  @Sse('stream')
  @ApiOperation({
    summary:
      'Realtime stream of unseen-count changes and new notifications (SSE)',
  })
  stream(
    @CurrentUser() user: SessionUser,
    @Req() req: Request,
  ): Observable<MessageEvent> {
    return this.notificationsService.stream(user, req);
  }

  @Get('unseen-count')
  @ApiOperation({ summary: 'Get unseen notifications count' })
  @ApiResponse({
    status: 200,
    description:
      'The unseen notifications count has been successfully retrieved.',
  })
  async getUnseenCount(
    @CurrentUser() user: SessionUser,
  ): Promise<UnseenCountResponseDto> {
    const count = await this.notificationsService.getUnseenCount(user.id, user.type);
    return { count };
  }

  @Post('token')
  @ApiOperation({ summary: 'Save user token' })
  @ApiResponse({
    status: 200,
    description: 'The user token has been successfully saved.',
  })
  @ApiBody({
    description: 'The user token to save',
    type: SaveTokenDto,
  })
  saveToken(
    @CurrentUser() user: SessionUser,
    @Body() body: SaveTokenDto,
  ): Promise<void> {
    return this.notificationsService.saveToken(user, body.token);
  }
}
