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
import { BlocksService } from './blocks.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Block } from './entities/block.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListBlocksDto } from './dto/list-blocks.dto';
import { ListBlocksResponseDto } from './dto/list-blocks-response.dto';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';

@Controller('blocks')
@ApiTags('Blocks')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@AuthorizedUserType.isCustomer()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post('/:id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Block a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully blocked.',
    type: Block,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiParam({ name: 'id', description: 'The ID of the user to block' })
  block(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Block> {
    return this.blocksService.block(id, user);
  }

  @Get()
  @ApiOperation({ summary: 'List blocked users' })
  @ApiResponse({
    status: 200,
    description: 'The blocked users have been successfully retrieved.',
    type: ListBlocksResponseDto,
  })
  find(
    @Query() query: ListBlocksDto,
    @CurrentUser() user: SessionUser,
  ): Promise<ListBlocksResponseDto> {
    return this.blocksService.find(query, user);
  }

  @Post(':id/unblock')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully unblocked.',
  })
  @ApiResponse({ status: 404, description: 'Block not found.' })
  @ApiParam({ name: 'id', description: 'The ID of the user to unblock' })
  unblock(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.blocksService.unblock(id, user);
  }
}
