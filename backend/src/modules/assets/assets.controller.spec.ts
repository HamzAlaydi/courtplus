import { Test, TestingModule } from '@nestjs/testing';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetType } from './entities/asset.entity';
import type { SessionUser } from '../auth/@types/session';
import { UserType } from '../auth/@types/user.type';

describe('AssetsController', () => {
  let controller: AssetsController;
  let assetsService: AssetsService;

  const mockAssetsService = {
    generateUploadUrl: jest.fn(),
  };

  const mockSessionUser: SessionUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    type: UserType.Customer,
    sid: 'session-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: mockAssetsService,
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
    assetsService = module.get<AssetsService>(AssetsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateUrl', () => {
    it('should generate signed URL for asset upload', async () => {
      const generateUrlDto = {
        type: AssetType.ProfilePicture,
      };

      const mockResponse = {
        id: 'asset-123',
        assetUrl: 'https://cdn.example.com/assets/asset-123',
        s3: {
          url: 'https://s3.example.com',
          fields: {
            key: 'assets/asset-123',
            policy: 'encoded-policy',
          },
          key: 'assets/asset-123',
        },
      };

      mockAssetsService.generateUploadUrl.mockResolvedValue(mockResponse);

      const result = await controller.generateUrl(
        generateUrlDto,
        mockSessionUser,
      );
      expect(result).toEqual(mockResponse);
      expect(assetsService.generateUploadUrl).toHaveBeenCalledWith(
        generateUrlDto,
        mockSessionUser,
      );
    });

    it('should handle different asset types', async () => {
      const assetTypes = [
        AssetType.ProfilePicture,
        AssetType.CoverPicture,
        AssetType.CourtImage,
        AssetType.PostVideo,
        AssetType.TenantDocument,
      ];

      for (const type of assetTypes) {
        mockAssetsService.generateUploadUrl.mockResolvedValue({
          id: `asset-${type}`,
          assetUrl: `https://cdn.example.com/assets/${type}`,
          s3: {
            url: 'https://s3.example.com',
            fields: { key: `assets/${type}` },
            key: `assets/${type}`,
          },
        });

        await controller.generateUrl({ type }, mockSessionUser);

        expect(assetsService.generateUploadUrl).toHaveBeenCalledWith(
          { type },
          mockSessionUser,
        );
      }

      expect(assetsService.generateUploadUrl).toHaveBeenCalledTimes(
        assetTypes.length,
      );
    });
  });
});
