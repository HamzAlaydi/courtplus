import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { ListBlocksDto } from './dto/list-blocks.dto';
import { ListBlocksResponseDto } from './dto/list-blocks-response.dto';
import { UsersService } from '../users/users.service';
import {
  BLOCK_NOT_FOUND,
  CANNOT_BLOCK_SELF,
  USER_NOT_FOUND,
} from 'src/modules/shared/error-codes';
import type { SessionUser } from '../auth/@types/session';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blocksRepository: Repository<Block>,
    private readonly usersService: UsersService,
  ) { }

  @Transactional()
  /**
   * Everyone this user cannot see and who cannot see them — BOTH directions.
   *
   * Blocking was recorded but never enforced anywhere: a blocked person still
   * appeared in search, in follower lists and in the community feed. Any query
   * that returns people or their content should exclude these ids.
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const rows = await this.blocksRepository.find({
      where: [{ blockerId: userId }, { blockedId: userId }],
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
    }
    return [...ids];
  }

  async block(blockedId: string, user: SessionUser): Promise<Block> {
    const blockerId = user.id;

    if (blockerId === blockedId) {
      throw new BadRequestException(CANNOT_BLOCK_SELF);
    }

    const blockedUser = await this.usersService.exists({ id: blockedId });
    if (!blockedUser) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const existingBlock = await this.blocksRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (existingBlock) {
      return existingBlock;
    }

    const block = await this.blocksRepository.save({
      blockerId,
      blockedId,
    });

    return block;
  }

  async find(
    query: ListBlocksDto,
    currentUser: SessionUser,
  ): Promise<ListBlocksResponseDto> {
    const { search, page = 1, pageSize = 10 } = query;
    const skip = (page - 1) * pageSize;
    const blockerId = currentUser.id;
    const where: FindOptionsWhere<Block> = { blockerId };

    if (search) {
      where.blocked = {
        firstName: Like(`%${search}%`),
        lastName: Like(`%${search}%`),
        username: Like(`%${search}%`),
        email: Like(`%${search}%`),
      };
    }
    const [items, total] = await this.blocksRepository.findAndCount({
      where,
      relations: {
        blocked: true,
      },
      skip,
      take: pageSize,
      select: {
        blocked: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatarUrl: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    };
  }


  async unblock(blockedId: string, user: SessionUser): Promise<void> {
    const blockerId = user.id;

    if (blockerId === blockedId) {
      throw new BadRequestException(CANNOT_BLOCK_SELF);
    }

    const result = await this.blocksRepository.delete({
      blockerId,
      blockedId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(BLOCK_NOT_FOUND);
    }

  }
}
