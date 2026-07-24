import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';
import { UserType } from '../auth/@types/user.type';

describe('FriendshipsController', () => {
  let controller: FriendshipsController;
  let service: jest.Mocked<FriendshipsService>;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipsController],
      providers: [
        {
          provide: FriendshipsService,
          useValue: {
            follow: jest.fn(),
            find: jest.fn(),
            unfollow: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FriendshipsController>(FriendshipsController);
    service = module.get(FriendshipsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('follow', () => {
    it('should call service.follow with correct parameters', async () => {
      service.follow.mockResolvedValue(mockFriendship as any);

      const result = await controller.follow(mockSessionUser, 'user-2');

      expect(service.follow).toHaveBeenCalledWith('user-2', mockSessionUser);
      expect(result).toEqual(mockFriendship);
    });
  });

  describe('find', () => {
    it('should call service.find with correct parameters', async () => {
      const mockQuery = { type: 'followers' };
      const mockResponse = {
        items: [mockFriendship],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
        },
      };

      service.find.mockResolvedValue(mockResponse as any);

      const result = await controller.find(mockQuery as any, mockSessionUser);

      expect(service.find).toHaveBeenCalledWith(mockQuery, mockSessionUser);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('unfollow', () => {
    it('should call service.unfollow with correct parameters', async () => {
      service.unfollow.mockResolvedValue(undefined);

      await controller.unfollow(mockSessionUser, 'user-2');

      expect(service.unfollow).toHaveBeenCalledWith('user-2', mockSessionUser);
    });
  });
});
