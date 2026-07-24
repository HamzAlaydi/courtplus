import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { PostLike } from './entities/post-like.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  UNAUTHORIZED_TO_DELETE_POST,
  POST_NOT_FOUND,
  ASSET_NOT_FOUND,
  NOT_BOOKING_PARTICIPANT,
  ASSET_NOT_OWNED,
} from '../shared/error-codes';
import { BookingsService } from '../bookings/bookings.service';
import { AssetsService } from '../assets/assets.service';
import type { SessionUser } from '../auth/@types/session';
import { PostEvent } from './posts.events';
import type {
  PostCreatedEvent,
  PostDeletedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
} from './posts.events';
import { NotificationsService } from '../notifications/notifications.service';
import { ListPostsDto } from './dto/list-posts.dto';
import { ListPostsResponseDto } from './dto/list-posts-response.dto';
import { NotificationType } from '../notifications/entities/notification.entity';
import { sanitizeUser } from '../auth/util/user';
import { AssetType } from '../assets/entities/asset.entity';
import { BranchesService } from '../branches/branches.service';
import { UsersService } from '../users/users.service';
import { CourtsService } from '../courts/courts.service';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { BookingEventsService } from '../bookings/events.service';
import { BookingEventType } from '../bookings/entities/event.entity';
import { ParticipantsService } from '../bookings/participants.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => BookingEventsService))
    private readonly bookingEventsService: BookingEventsService,
    @Inject(forwardRef(() => ParticipantsService))
    private readonly participantsService: ParticipantsService,
    private readonly assetsService: AssetsService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) { }

  async findByIds(
    ids: string[],
    select?: FindOptionsSelect<Post>,
  ): Promise<Post[]> {
    return this.postRepository.find({
      where: {
        id: In(ids),
      },
      select,
    });
  }

  @Transactional()
  async createPost(
    createPostDto: CreatePostDto,
    user: SessionUser,
  ): Promise<Post> {
    const { bookingId, assetId } = createPostDto;
    const participant = await this.participantsService.getParticipant(
      bookingId,
      user.id,
    );
    if (!participant) {
      throw new ForbiddenException(NOT_BOOKING_PARTICIPANT);
    }

    if (assetId) {
      const asset = await this.assetsService.getById(assetId);
      if (!asset) {
        throw new NotFoundException(ASSET_NOT_FOUND);
      }
      if (asset.uploadedBy !== user.id) {
        throw new ForbiddenException(ASSET_NOT_OWNED);
      }
    }
    const post = await this.postRepository.save({
      ...createPostDto,
      userId: user.id,
    });
    if (assetId) {
      await this.assetsService.assignAssets(
        assetId,
        post.id,
        AssetType.PostImage,
      );
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(PostEvent.POST_CREATED, {
        postId: post.id,
      });
    });

    return post;
  }

  async getPosts(
    listPostsDto: ListPostsDto,
    user: SessionUser,
  ): Promise<ListPostsResponseDto> {
    const { bookingId, userId, courtId, branchId, page, pageSize } =
      listPostsDto;
    const where: FindOptionsWhere<Post> = {};
    if (bookingId) {
      where.bookingId = bookingId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (courtId) {
      where.booking = { courtId };
    }

    if (branchId) {
      where.booking = { court: { branchId } };
    }

    const [posts, totalCount] = await this.postRepository.findAndCount({
      where,
      relations: {
        user: true,
        asset: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const postIds = posts.map((post) => post.id);
    const likes = await this.postLikeRepository.find({
      where: {
        postId: In(postIds),
        userId: user.id,
      },
    });

    posts.forEach((post) => {
      post.isLiked = likes.some((like) => like.postId === post.id);

      if (post.user) {
        const user = sanitizeUser(post.user);
        post.user = user;
      }
      if (post.assetId) {
        post.assetUrl = this.assetsService.getUrl(post.assetId);
      }
    });

    return {
      items: posts,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
      },
    };
  }

  @Transactional()
  async likePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(POST_NOT_FOUND);
    }

    const result = await this.postLikeRepository.upsert(
      {
        postId,
        userId,
      },
      {
        conflictPaths: ['postId', 'userId'],
      },
    );

    if (result.identifiers.length > 0 && result.identifiers[0].id) {
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(PostEvent.POST_LIKED, {
          post,
          likedBy: userId,
        });
      });
    }
  }

  @Transactional()
  async unlikePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException(POST_NOT_FOUND);
    }

    const result = await this.postLikeRepository.delete({
      postId,
      userId,
    });

    if (result.affected && result.affected > 0) {
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(PostEvent.POST_UNLIKED, {
          post,
          userId,
        });
      });
    }
  }

  @Transactional()
  async deletePost(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, userId },
      relations: { booking: { court: true } },
    });

    if (!post) {
      throw new ForbiddenException(UNAUTHORIZED_TO_DELETE_POST);
    }

    await this.postRepository.remove(post);

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(PostEvent.POST_DELETED, {
        post,
      });
    });
  }

  @Transactional()
  private async updateStats(post: Post, count: number) {
    await this.usersService.incrementCount(post.userId, count, 'postsCount');

    if (!post.booking?.court) {
      this.logger.warn(
        `Post ${post.id} has no associated booking/court, skipping court/branch stats update`,
      );
      return;
    }

    await this.courtsService.increment(
      post.booking.court.id,
      'postsCount',
      count,
    );
    await this.branchesService.increment(
      post.booking.court.branchId,
      'postsCount',
      count,
    );
  }

  @OnEvent(PostEvent.POST_CREATED)
  @Transactional()
  private async handlePostCreated(event: PostCreatedEvent) {
    try {
      const { postId } = event;
      const post = await this.postRepository.findOne({
        where: { id: postId },
        relations: { booking: { court: true } },
      });
      if (!post) {
        this.logger.warn(`Post ${postId} not found in handlePostCreated`);
        return;
      }
      await this.updateStats(post, 1);
      await this.bookingsService.notifyParticipants(
        post.bookingId,
        NotificationType.MOMENT_POSTED,
        { postId: post.id, userId: post.userId },
        [post.userId],
      );
      await this.bookingEventsService.create({
        bookingId: post.bookingId,
        userId: post.userId,
        event: BookingEventType.MOMENT_POSTED,
        data: { postId: post.id },
      });
    } catch (error) {
      this.logger.error(`Failed to handle post created event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(PostEvent.POST_DELETED)
  @Transactional()
  private async handlePostDeleted(event: PostDeletedEvent) {
    try {
      const { post } = event;
      await this.updateStats(post, -1);
      if (post.assetId) {
        await this.assetsService.delete(post.assetId);
      }
    } catch (error) {
      this.logger.error(`Failed to handle post deleted event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(PostEvent.POST_LIKED)
  private async handlePostLiked(event: PostLikedEvent) {
    try {
      const { post, likedBy } = event;
      await this.postRepository.increment({ id: post.id }, 'likesCount', 1);

      if (post.userId === likedBy) {
        return;
      }

      await this.notificationsService.sendNotification(post.userId, {
        type: NotificationType.POST_LIKE,
        data: {
          postId: post.id,
          userId: likedBy,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to handle post liked event: ${error.message}`, error.stack);
    }
  }

  @OnEvent(PostEvent.POST_UNLIKED)
  private async handlePostUnliked(event: PostUnlikedEvent) {
    const { post, userId } = event;

    await this.postRepository.decrement({ id: post.id }, 'likesCount', 1);
  }
}
