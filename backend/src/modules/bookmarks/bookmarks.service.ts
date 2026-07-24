import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { BookmarkDto } from './dto/bookmark.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Bookmark, BookmarkType } from './entities/bookmark.entity';
import { CourtsService } from '../courts/courts.service';
import { UsersService } from '../users/users.service';
import { BranchesService } from '../branches/branches.service';
import { ListBookmarksDto } from './dto/list-bookmarks.dto';
import {
  RESOURCE_NOT_FOUND,
  BOOKMARK_NOT_FOUND,
  BOOKMARK_ALREADY_EXISTS,
} from '../shared/error-codes';
import { groupBy } from 'lodash';
import { SessionUser } from '../auth/@types/session';
import { UserLocation } from 'src/decorators/location.decorator';
import { ListBookmarksResponseDto } from './dto/list-bookmarks-response.dto';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { BookmarkEventType } from './bookmark.events';
import type { BookmarkEvent } from './bookmark.events';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarksRepository: Repository<Bookmark>,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  @Transactional()
  async create({ resourceId, type }: BookmarkDto, userId: string) {
    const resourceExists = await this.checkResourceExists(resourceId, type);

    if (!resourceExists) {
      throw new NotFoundException(RESOURCE_NOT_FOUND);
    }

    let bookmark = this.bookmarksRepository.create({
      userId,
      resourceId,
      type,
    });

    const result = await this.bookmarksRepository.upsert(bookmark, {
      conflictPaths: ['userId', 'resourceId', 'type'],
      skipUpdateIfNoValuesChanged: true,
    });

    const insertResult =
      result.raw && result.raw.length > 0 ? result.raw[0] : null;

    if (insertResult) {
      bookmark = { ...bookmark, ...insertResult };
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookmarkEventType.CREATED, {
          bookmark,
        } satisfies BookmarkEvent);
      });

      return bookmark;
    }

    throw new BadRequestException(BOOKMARK_ALREADY_EXISTS);
  }

  private async checkResourceExists(
    resourceId: string,
    resourceType: BookmarkType,
  ): Promise<boolean> {
    switch (resourceType) {
      case BookmarkType.COURT:
        return this.courtsService.exists(resourceId);
      case BookmarkType.USER:
        return this.usersService.exists({ id: resourceId });
      case BookmarkType.BRANCH:
        return this.branchesService.exists(resourceId);
    }
  }
  async list(
    query: ListBookmarksDto,
    user: SessionUser,
    location: UserLocation,
  ): Promise<ListBookmarksResponseDto> {
    const { types, page = 1, pageSize = 10, search } = query;
    const qb = this.bookmarksRepository
      .createQueryBuilder('bookmark')
      .where('bookmark.userId = :userId', { userId: user.id })
      .orderBy('bookmark.createdAt', 'DESC');

    if (types) {
      qb.andWhere('bookmark.type IN (:...types)', { types });
    }

    const [bookmarks, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    const groupedBookmarks = groupBy(bookmarks, 'type');

    const courtBookmarks = groupedBookmarks[BookmarkType.COURT];
    const userBookmarks = groupedBookmarks[BookmarkType.USER];
    const branchBookmarks = groupedBookmarks[BookmarkType.BRANCH];

    const promises = [];
    if (courtBookmarks && courtBookmarks.length > 0) {
      const courtsPromise = this.courtsService.findAll(
        {
          ids: courtBookmarks.map((bookmark) => bookmark.resourceId),
          search,
          options: {
            include: {
              branch: true,
            },
          },
        },
        user,
        location,
      );
      promises.push(courtsPromise);
    } else {
      promises.push(Promise.resolve([]));
    }

    if (userBookmarks && userBookmarks.length > 0) {
      const usersPromise = this.usersService.find(
        {
          ids: userBookmarks.map((bookmark) => bookmark.resourceId),
          search,
        },
        user,
      );
      promises.push(usersPromise);
    } else {
      promises.push(Promise.resolve([]));
    }

    if (branchBookmarks && branchBookmarks.length > 0) {
      const branchesPromise = this.branchesService.find(
        {
          ids: branchBookmarks.map((bookmark) => bookmark.resourceId),
          search,
        },
        user,
      );
      promises.push(branchesPromise);
    } else {
      promises.push(Promise.resolve([]));
    }

    const [{ items: courts }, { items: users }, { items: branches }] =
      await Promise.all(promises);

    const items = bookmarks.map((bookmark) => {
      const result = { ...bookmark };

      switch (bookmark.type) {
        case BookmarkType.COURT:
          result.court =
            courts.find((court) => court?.id === bookmark.resourceId) || null;
          if (result.court) {
            result.court.isBookmarked = true;
          }
          break;
        case BookmarkType.USER:
          result.user =
            users.find((user) => user?.id === bookmark.resourceId) || null;
          break;
        case BookmarkType.BRANCH:
          result.branch =
            branches.find((branch) => branch?.id === bookmark.resourceId) ||
            null;
          if (result.branch) {
            result.branch.isBookmarked = true;
          }
          break;
      }

      return result;
    });

    return {
      items,
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    } satisfies ListBookmarksResponseDto;
  }

  @Transactional()
  async delete(id: string, userId: string): Promise<boolean> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: {
        resourceId: id,
        userId,
      },
    });

    if (!bookmark) {
      throw new NotFoundException(BOOKMARK_NOT_FOUND);
    }

    const result = await this.bookmarksRepository.delete({
      resourceId: id,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(BOOKMARK_NOT_FOUND);
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BookmarkEventType.DELETED, {
        bookmark,
      } satisfies BookmarkEvent);
    });

    return !!result.affected;
  }

  async getBookmarkedResources(
    resourceIds: string[],
    userId: string,
  ): Promise<Set<string>> {
    if (resourceIds.length === 0) {
      throw new BadRequestException(RESOURCE_NOT_FOUND);
    }
    const bookmarks = new Set<string>();
    const uncachedResourceIds: string[] = [];
    const cachedBookmarks = await this.redis.smismember(
      `bookmarks:${userId}`,
      ...resourceIds,
    );

    resourceIds.map((resourceId, index) => {
      const cachedBookmark = cachedBookmarks[index];

      if (cachedBookmark) {
        bookmarks.add(resourceId);
      } else {
        uncachedResourceIds.push(resourceId);
      }
    });

    if (uncachedResourceIds.length === 0) {
      return bookmarks;
    }

    const dbBookmarks = await this.bookmarksRepository.find({
      where: {
        resourceId: In(uncachedResourceIds),
        userId,
      },
      select: ['resourceId'],
    });

    dbBookmarks.forEach((bookmark) => {
      bookmarks.add(bookmark.resourceId);
    });
    if (dbBookmarks.length > 0) {
      await this.redis.sadd(
        `bookmarks:${userId}`,
        ...dbBookmarks.map((bookmark) => bookmark.resourceId),
      );
    }

    return bookmarks;
  }

  private async invalidateBookmarkCache(userId: string, resourceId: string) {
    const userTypeCacheKey = `bookmarks:${userId}:${resourceId}`;

    try {
      await this.redis.srem(`bookmarks:${userId}`, resourceId);
    } catch (error) {
      console.error(
        `Failed to invalidate cache for pattern: ${userTypeCacheKey}:*`,
        error,
      );
    }
  }

  @OnEvent(BookmarkEventType.CREATED)
  private async handleBookmarkCreated({ bookmark }: BookmarkEvent) {
    await Promise.allSettled([
      this.usersService.invalidateUser(bookmark.userId),
      this.invalidateBookmarkCache(bookmark.userId, bookmark.resourceId),
    ]);
  }

  @OnEvent(BookmarkEventType.DELETED)
  private async handleBookmarkDeleted({ bookmark }: BookmarkEvent) {
    await Promise.allSettled([
      this.usersService.invalidateUser(bookmark.userId),
      this.invalidateBookmarkCache(bookmark.userId, bookmark.resourceId),
    ]);
  }
}
