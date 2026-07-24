import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipsService } from './friendships.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  initializeTransactionalContext,
  addTransactionalDataSource,
} from 'typeorm-transactional';

// @Transactional() requires an initialized CLS context and a registered
// DataSource. Register a stub whose transaction() just runs the callback
// with a dummy EntityManager — the specs mock all repositories, so no real
// database is involved.
initializeTransactionalContext();
addTransactionalDataSource({
  dataSource: {
    transaction: (cb: (em: EntityManager) => unknown) => cb({} as EntityManager),
  } as unknown as DataSource,
  patch: false,
});
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Friendship } from './entities/friendship.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FRIENDSHIP_NOT_FOUND,
  USER_NOT_FOUND,
} from 'src/modules/shared/error-codes';
import { FriendshipEventType } from './friendships.events';
import { FriendshipType } from './dto/list-friendships.dto';
import { UserType } from '../auth/@types/user.type';

describe('FriendshipsService', () => {
  let service: FriendshipsService;
  let friendshipsRepository: jest.Mocked<Repository<Friendship>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let usersService: jest.Mocked<UsersService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockSessionUser = {
    id: 'user-1',
    email: 'john@example.com',
    type: UserType.Customer,
    firstName: 'John',
    lastName: 'Doe',
    sid: 'session-1',
  };

  const mockFriendship = {
    id: 'friendship-1',
    followerId: 'user-1',
    followingId: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    follower: undefined,
    following: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipsService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getCount: jest.fn(),
              getRawAndEntities: jest.fn(),
              clone: jest.fn().mockReturnThis(),
            })),
            manager: {
              transaction: jest.fn((callback) => callback({} as EntityManager)),
            },
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            exists: jest.fn(),
            incrementCount: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FriendshipsService>(FriendshipsService);
    friendshipsRepository = module.get(getRepositoryToken(Friendship));
    eventEmitter = module.get(EventEmitter2);
    usersService = module.get(UsersService);
    notificationsService = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('follow', () => {
    it('should throw BadRequestException when trying to follow oneself', async () => {
      await expect(service.follow('user-1', mockSessionUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when follower does not exist', async () => {
      usersService.exists.mockResolvedValueOnce(false);
      await expect(service.follow('user-2', mockSessionUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(usersService.exists).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should throw NotFoundException when following user does not exist', async () => {
      usersService.exists
        .mockResolvedValueOnce(true) // follower exists
        .mockResolvedValueOnce(false); // following does not exist
      await expect(service.follow('user-2', mockSessionUser)).rejects.toThrow(
        new NotFoundException(USER_NOT_FOUND),
      );
    });

    it('should return existing friendship if already exists', async () => {
      usersService.exists.mockResolvedValue(true);
      friendshipsRepository.findOne.mockResolvedValue(mockFriendship as any);

      const result = await service.follow('user-2', mockSessionUser);

      expect(result).toEqual(mockFriendship);
      expect(friendshipsRepository.save).not.toHaveBeenCalled();
    });

    it('should create new friendship and emit event', async () => {
      usersService.exists.mockResolvedValue(true);
      friendshipsRepository.findOne.mockResolvedValue(null);
      friendshipsRepository.save.mockResolvedValue(mockFriendship as any);

      const result = await service.follow('user-2', mockSessionUser);

      // The FOLLOW event is emitted via runOnTransactionCommit, which fires
      // on setImmediate after the (stubbed) transaction commits.
      await new Promise((resolve) => setImmediate(resolve));

      expect(result).toEqual(mockFriendship);
      expect(friendshipsRepository.save).toHaveBeenCalledWith({
        followerId: 'user-1',
        followingId: 'user-2',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        FriendshipEventType.FOLLOW,
        { followerId: 'user-1', followingId: 'user-2' },
      );
    });
  });

  describe('find', () => {
    it('should return paginated list of friendships', async () => {
      const mockQuery = {
        userId: 'user-1',
        search: 'John',
        page: 1,
        pageSize: 10,
        type: FriendshipType.FOLLOWERS,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [mockFriendship],
          raw: [
            {
              userId: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              username: 'janedoe',
              avatarUrl: 'http://example.com/avatar2.jpg',
              isFollowing: true,
              isFollowed: false,
            },
          ],
        }),
        clone: jest.fn().mockReturnThis(),
      };

      friendshipsRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.find(mockQuery, mockSessionUser);

      expect(result).toEqual({
        items: [
          {
            ...mockFriendship,
            user: {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Doe',
              username: 'janedoe',
              avatarUrl: 'http://example.com/avatar2.jpg',
              isFollowing: true,
              isFollowed: true,
            },
          },
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
        },
      });
    });
  });

  describe('unfollow', () => {
    it('should throw BadRequestException when trying to unfollow oneself', async () => {
      await expect(service.unfollow('user-1', mockSessionUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when friendship does not exist', async () => {
      friendshipsRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.unfollow('user-2', mockSessionUser)).rejects.toThrow(
        new NotFoundException(FRIENDSHIP_NOT_FOUND),
      );
    });

    it('should successfully unfollow and emit event', async () => {
      friendshipsRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.unfollow('user-2', mockSessionUser);

      expect(friendshipsRepository.delete).toHaveBeenCalledWith({
        followerId: 'user-1',
        followingId: 'user-2',
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        FriendshipEventType.UNFOLLOW,
        { followerId: 'user-1', followingId: 'user-2' },
      );
    });
  });

  describe('handleFollowEvent', () => {
    it('should increment user counts and send notification', async () => {
      const event = { followerId: 'user-1', followingId: 'user-2' };

      await (service as any).handleFollowEvent(event);

      expect(usersService.incrementCount).toHaveBeenCalledWith(
        'user-1',
        1,
        'followingCount',
      );
      expect(usersService.incrementCount).toHaveBeenCalledWith(
        'user-2',
        1,
        'followersCount',
      );
      expect(notificationsService.sendNotification).toHaveBeenCalledWith(
        'user-2',
        expect.objectContaining({
          type: 'follow',
          data: {
            userId: 'user-1',
          },
        }),
      );
    });
  });

  describe('handleUnfollowEvent', () => {
    it('should decrement user counts', async () => {
      const event = { followerId: 'user-1', followingId: 'user-2' };

      await (service as any).handleUnfollowEvent(event);

      expect(usersService.incrementCount).toHaveBeenCalledWith(
        'user-1',
        -1,
        'followingCount',
      );
      expect(usersService.incrementCount).toHaveBeenCalledWith(
        'user-2',
        -1,
        'followersCount',
      );
    });
  });
});
