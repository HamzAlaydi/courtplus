import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ListFriendshipsDto, FriendshipType } from './dto/list-friendships.dto';
import { ListFriendshipsResponseDto } from './dto/list-friendships-response.dto';
import { FriendshipEventType } from './friendships.events';
import { UsersService } from '../users/users.service';
import {
  FRIENDSHIP_NOT_FOUND,
  USER_NOT_FOUND,
} from 'src/modules/shared/error-codes';
import type { SessionUser } from '../auth/@types/session';
import { NotificationType } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import type { FriendshipEvent } from './friendships.events';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
@Injectable()
export class FriendshipsService {
  private readonly logger = new Logger(FriendshipsService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipsRepository: Repository<Friendship>,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) { }

  @Transactional()
  async follow(followingId: string, user: SessionUser) {
    const followerId = user.id;
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const [follower, following] = await Promise.all([
      this.usersService.exists({ id: followerId }),
      this.usersService.exists({ id: followingId }),
    ]);

    if (!follower || !following) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const existingFriendship = await this.friendshipsRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFriendship) {
      return existingFriendship;
    }

    const friendship = await this.friendshipsRepository.save({
      followerId,
      followingId,
    });

    runOnTransactionCommit(() => {
      const event: FriendshipEvent = { followerId, followingId };
      this.eventEmitter.emit(FriendshipEventType.FOLLOW, event);
    });

    return friendship;
  }

  async find(
    query: ListFriendshipsDto,
    currentUser: SessionUser,
  ): Promise<ListFriendshipsResponseDto> {
    const {
      userId,
      search,
      page = 1,
      pageSize = 10,
      type = FriendshipType.FOLLOWERS,
    } = query;
    const skip = (page - 1) * pageSize;
    const currentUserId = currentUser.id;
    const targetUserId = userId || currentUserId;
    const isSelf = currentUserId === targetUserId;

    let queryBuilder =
      this.friendshipsRepository.createQueryBuilder('friendship');

    if (type === FriendshipType.FOLLOWERS) {
      queryBuilder
        .where('friendship.followingId = :targetUserId', { targetUserId })
        .leftJoinAndSelect('friendship.follower', 'user');
    } else {
      queryBuilder
        .where('friendship.followerId = :targetUserId', { targetUserId })
        .leftJoinAndSelect('friendship.following', 'user');
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.username ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isSelf && type == FriendshipType.FOLLOWERS) {
      this.addFollowingQuery(queryBuilder, currentUserId, type);
    } else if (isSelf && type == FriendshipType.FOLLOWING) {
      this.addFollowedQuery(queryBuilder, currentUserId, type);
    } else {
      this.addFollowingQuery(queryBuilder, currentUserId, type);
      this.addFollowedQuery(queryBuilder, currentUserId, type);
    }

    queryBuilder.addSelect([
      'user.id as "userId"',
      'user.firstName as "firstName"',
      'user.lastName as "lastName"',
      'user.username as "username"',
      'user.avatarUrl as "avatarUrl"',
    ]);

    const [total, result] = await Promise.all([
      queryBuilder.clone().getCount(),
      queryBuilder.skip(skip).take(pageSize).getRawAndEntities(),
    ]);

    const transformedItems = result.entities.map((item, index) => {
      const raw = result.raw[index];
      return {
        ...item,
        user: {
          id: raw.userId,
          firstName: raw.firstName,
          lastName: raw.lastName,
          username: raw.username,
          avatarUrl: raw.avatarUrl,
          isFollowing:
            (isSelf && type == FriendshipType.FOLLOWING) || raw.isFollowing,
          isFollowed:
            (isSelf && type == FriendshipType.FOLLOWERS) || raw.isFollowed,
        },
      };
    });

    return {
      items: transformedItems as Friendship[],
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    };
  }

  private addFollowingQuery(
    queryBuilder: SelectQueryBuilder<Friendship>,
    currentUserId: string,
    type: FriendshipType,
  ) {
    queryBuilder.leftJoinAndSelect(
      'friendships',
      'currentUserFollowing',
      'currentUserFollowing.followerId = :currentUserId AND ' +
      (type === FriendshipType.FOLLOWERS
        ? 'currentUserFollowing.followingId = friendship.followerId'
        : 'currentUserFollowing.followingId = friendship.followingId'),
      { currentUserId },
    );
    queryBuilder.addSelect([
      'CASE WHEN currentUserFollowing.id IS NOT NULL THEN true ELSE false END as "isFollowing"',
    ]);
  }

  private addFollowedQuery(
    queryBuilder: SelectQueryBuilder<Friendship>,
    currentUserId: string,
    type: FriendshipType,
  ) {
    queryBuilder.leftJoinAndSelect(
      'friendships',
      'currentUserFollowed',
      'currentUserFollowed.followingId = :currentUserId AND ' +
      (type === FriendshipType.FOLLOWERS
        ? 'currentUserFollowed.followerId = friendship.followerId'
        : 'currentUserFollowed.followerId = friendship.followingId'),
      { currentUserId },
    );
    queryBuilder.addSelect([
      'CASE WHEN currentUserFollowed.id IS NOT NULL THEN true ELSE false END as "isFollowed"',
    ]);
  }

  async unfollow(followingId: string, user: SessionUser) {
    const followerId = user.id;
    if (followerId === followingId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const result = await this.friendshipsRepository.delete({
      followerId,
      followingId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(FRIENDSHIP_NOT_FOUND);
    }

    const event: FriendshipEvent = { followerId, followingId };
    this.eventEmitter.emit(FriendshipEventType.UNFOLLOW, event);
  }

  @OnEvent(FriendshipEventType.FOLLOW)
  @Transactional()
  private async handleFollowEvent(event: FriendshipEvent) {
    const { followerId, followingId } = event;
    await this.usersService.incrementCount(followerId, 1, 'followingCount');
    await this.usersService.incrementCount(followingId, 1, 'followersCount');
    const follower = await this.usersService.getById(followerId);
    await this.notificationsService.sendNotification(followingId, {
      type: NotificationType.FOLLOW,
      data: {
        userId: followerId,
        firstName: follower?.firstName,
        lastName: follower?.lastName,
      },
    });
  }

  @OnEvent(FriendshipEventType.UNFOLLOW)
  @Transactional()
  private async handleUnfollowEvent(event: FriendshipEvent) {
    const { followerId, followingId } = event;
    await this.usersService.incrementCount(followerId, -1, 'followingCount');
    await this.usersService.incrementCount(followingId, -1, 'followersCount');
  }
}
