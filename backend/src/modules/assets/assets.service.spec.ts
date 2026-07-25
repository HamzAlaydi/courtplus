import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { Asset, AssetType } from './entities/asset.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, In, Not, DataSource } from 'typeorm';
import { S3Service } from 'src/modules/shared/services/s3.service';
import { ConfigService } from '@nestjs/config';
import { RekognitionService } from './rekognition.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { ASSET_NOT_FOUND } from '../shared/error-codes';
import { AssetEvent } from './assets.events';
import type { SessionUser } from '../auth/@types/session';
import { UserType } from '../auth/@types/user.type';
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

describe('AssetsService', () => {
  let service: AssetsService;

  const mockAssetRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };

  const mockS3Service = {
    generateUploadUrl: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockRekognitionService = {
    detectExplicitContent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
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
      providers: [
        AssetsService,
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: RekognitionService,
          useValue: mockRekognitionService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);

    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'aws.cdnUrl': 'https://cdn.example.com',
        'aws.bucketName': 'test-bucket',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUploadUrl', () => {
    it('should generate upload URL for profile picture', async () => {
      const generateUrlDto = {
        type: AssetType.ProfilePicture,
      };

      const mockS3Response = {
        url: 'https://s3.example.com',
        fields: { key: 'assets/asset-id' },
        key: 'assets/asset-id',
      };

      const mockAsset = {
        id: 'asset-123',
        key: 'assets/asset-123',
        bucket: 'test-bucket',
        uploadedBy: mockSessionUser.id,
      };

      mockS3Service.generateUploadUrl.mockResolvedValue(mockS3Response);
      mockAssetRepository.save.mockResolvedValue(mockAsset);

      const result = await service.generateUploadUrl(
        generateUrlDto,
        mockSessionUser,
      );

      expect(result).toEqual({
        s3: mockS3Response,
        id: mockAsset.id,
        assetUrl: 'https://cdn.example.com/assets/asset-123',
      });

      expect(mockS3Service.generateUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AssetType.ProfilePicture,
          fileType: 'image',
        }),
      );

      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: 'test-bucket',
          uploadedBy: mockSessionUser.id,
        }),
      );
    });

    it('should generate upload URL for video asset', async () => {
      const generateUrlDto = {
        type: AssetType.CourtVideo,
      };

      const mockS3Response = {
        url: 'https://s3.example.com',
        fields: { key: 'assets/video-id' },
        key: 'assets/video-id',
      };

      mockS3Service.generateUploadUrl.mockResolvedValue(mockS3Response);
      mockAssetRepository.save.mockResolvedValue({
        id: 'video-123',
        key: 'assets/video-123',
      });

      await service.generateUploadUrl(generateUrlDto, mockSessionUser);

      expect(mockS3Service.generateUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'video',
        }),
      );
    });

    it('should generate protected key for tenant documents', async () => {
      const generateUrlDto = {
        type: AssetType.TenantDocument,
      };

      mockS3Service.generateUploadUrl.mockResolvedValue({
        url: 'https://s3.example.com',
        fields: { key: 'files/doc-id' },
        key: 'files/doc-id',
      });
      mockAssetRepository.save.mockResolvedValue({
        id: 'doc-123',
        key: 'files/doc-123',
      });

      await service.generateUploadUrl(generateUrlDto, mockSessionUser);

      expect(mockS3Service.generateUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          fileType: 'application',
        }),
      );
    });
  });

  describe('assignAssets', () => {
    it('should assign single asset to resource', async () => {
      const assetId = 'asset-123';
      const resourceId = 'resource-456';
      const type = AssetType.ProfilePicture;

      const mockAsset = {
        id: assetId,
        key: 'assets/asset-123',
      };

      mockAssetRepository.find.mockResolvedValueOnce([mockAsset]);
      mockAssetRepository.find.mockResolvedValueOnce([]);
      mockAssetRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.assignAssets(assetId, resourceId, type);

      // The ASSET_ASSIGNED event is emitted via runOnTransactionCommit, which
      // fires on setImmediate after the (stubbed) transaction commits.
      await new Promise((resolve) => setImmediate(resolve));

      expect(result).toEqual([
        {
          url: 'https://cdn.example.com/assets/asset-123',
          id: assetId,
        },
      ]);

      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetId,
          used: true,
          resourceId,
          type,
          position: null,
        }),
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AssetEvent.ASSET_ASSIGNED,
        expect.objectContaining({
          asset: expect.objectContaining({ id: assetId }),
        }),
      );
    });

    it('should assign multiple assets to resource with positions', async () => {
      const assetIds = ['asset-1', 'asset-2', 'asset-3'];
      const resourceId = 'resource-456';
      const type = AssetType.CourtImage;

      const mockAssets = assetIds.map((id) => ({
        id,
        key: `assets/${id}`,
      }));

      mockAssetRepository.find.mockResolvedValueOnce(mockAssets);
      mockAssetRepository.find.mockResolvedValueOnce([]);
      mockAssetRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.assignAssets(assetIds, resourceId, type);

      // Events fire via runOnTransactionCommit on setImmediate after commit.
      await new Promise((resolve) => setImmediate(resolve));

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('asset-1');
      expect(result[1].id).toBe('asset-2');
      expect(result[2].id).toBe('asset-3');

      expect(mockAssetRepository.save).toHaveBeenCalledTimes(3);
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(3);
    });

    it('should unassign old assets when assigning new ones', async () => {
      const newAssetId = 'new-asset';
      const resourceId = 'resource-456';
      const type = AssetType.ProfilePicture;

      const oldAsset = {
        id: 'old-asset',
        key: 'assets/old-asset',
        resourceId,
        type,
      };

      mockAssetRepository.find.mockResolvedValueOnce([
        { id: newAssetId, key: 'assets/new-asset' },
      ]);
      mockAssetRepository.find.mockResolvedValueOnce([oldAsset]);
      mockAssetRepository.update.mockResolvedValue({ affected: 1 });

      await service.assignAssets(newAssetId, resourceId, type);

      expect(mockAssetRepository.update).toHaveBeenCalledWith(
        { id: In(['old-asset']) },
        {
          used: null,
          resourceId: null,
          type: null,
        },
      );
    });

    it('should throw NotFoundException when asset not found', async () => {
      const assetId = 'non-existent';
      const resourceId = 'resource-456';
      const type = AssetType.ProfilePicture;

      mockAssetRepository.find.mockResolvedValue([]);

      await expect(
        service.assignAssets(assetId, resourceId, type),
      ).rejects.toThrow(new NotFoundException(ASSET_NOT_FOUND));
    });
  });

  describe('unassignAssets', () => {
    it('should unassign assets', async () => {
      const assetIds = ['asset-1', 'asset-2'];

      mockAssetRepository.update.mockResolvedValue({ affected: 2 });

      await service.unassignAssets(assetIds);

      expect(mockAssetRepository.update).toHaveBeenCalledWith(
        { id: In(assetIds) },
        {
          used: null,
          resourceId: null,
          type: null,
        },
      );
    });
  });

  describe('delete', () => {
    it('should delete asset by id', async () => {
      const assetId = 'asset-123';
      const mockAsset = {
        id: assetId,
        key: 'assets/asset-123',
        bucket: 'test-bucket',
      };

      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockAssetRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(assetId);

      expect(result).toEqual(mockAsset);
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('assets/asset-123');
      expect(mockAssetRepository.delete).toHaveBeenCalledWith(assetId);
    });

    it('should delete asset by entity', async () => {
      const mockAsset = {
        id: 'asset-123',
        key: 'assets/asset-123',
        bucket: 'test-bucket',
      } as Asset;

      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockAssetRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(mockAsset);

      expect(result).toEqual(mockAsset);
      expect(mockAssetRepository.findOne).not.toHaveBeenCalled();
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('assets/asset-123');
    });

    it('should throw NotFoundException when asset not found', async () => {
      const assetId = 'non-existent';

      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.delete(assetId)).rejects.toThrow(
        new NotFoundException(ASSET_NOT_FOUND),
      );
    });

    it('should delete from S3 and database even if one fails', async () => {
      const mockAsset = {
        id: 'asset-123',
        key: 'assets/asset-123',
      } as Asset;

      mockS3Service.deleteFile.mockRejectedValue(new Error('S3 error'));
      mockAssetRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(mockAsset);

      expect(mockS3Service.deleteFile).toHaveBeenCalled();
      expect(mockAssetRepository.delete).toHaveBeenCalled();
    });
  });

  describe('cleanUp', () => {
    it('should clean up unused assets older than 2 hours', async () => {
      const oldAssets = [
        {
          id: 'old-1',
          key: 'assets/old-1',
          used: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          id: 'old-2',
          key: 'assets/old-2',
          used: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        },
      ] as Asset[];

      mockAssetRepository.find.mockResolvedValue(oldAssets);
      mockAssetRepository.findOne.mockImplementation((options) => {
        const asset = oldAssets.find((a) => a.id === options.where.id);
        return Promise.resolve(asset || null);
      });
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockAssetRepository.delete.mockResolvedValue({ affected: 1 });

      await service.cleanUp();

      expect(mockAssetRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            used: Not(true),
            updatedAt: expect.any(Object),
          },
          take: 50,
        }),
      );

      expect(mockS3Service.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockAssetRepository.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup with no assets to delete', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      await service.cleanUp();

      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(mockAssetRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUrl', () => {
    it('should generate asset URL', () => {
      const assetId = 'asset-123';
      const url = service.getUrl(assetId);

      expect(url).toBe('https://cdn.example.com/assets/asset-123');
    });
  });

  describe('getById', () => {
    it('should get asset by id', async () => {
      const assetId = 'asset-123';
      const mockAsset = {
        id: assetId,
        key: 'assets/asset-123',
      } as Asset;

      mockAssetRepository.findOneBy.mockResolvedValue(mockAsset);

      const result = await service.getById(assetId);

      expect(result).toEqual(mockAsset);
      expect(mockAssetRepository.findOneBy).toHaveBeenCalledWith({
        id: assetId,
      });
    });
  });

  describe('exists', () => {
    it('should check if asset exists', async () => {
      const assetId = 'asset-123';

      mockAssetRepository.exists.mockResolvedValue(true);

      const result = await service.exists(assetId);

      expect(result).toBe(true);
      expect(mockAssetRepository.exists).toHaveBeenCalledWith({
        where: { id: assetId },
      });
    });

    it('should return false if asset does not exist', async () => {
      const assetId = 'non-existent';

      mockAssetRepository.exists.mockResolvedValue(false);

      const result = await service.exists(assetId);

      expect(result).toBe(false);
    });
  });

  describe('find', () => {
    it('should find assets by criteria', async () => {
      const where = { resourceId: 'resource-123', type: AssetType.CourtImage };
      const mockAssets = [
        { id: 'asset-1', resourceId: 'resource-123' },
        { id: 'asset-2', resourceId: 'resource-123' },
      ] as Asset[];

      mockAssetRepository.findBy.mockResolvedValue(mockAssets);

      const result = await service.find(where);

      expect(result).toEqual(mockAssets);
      expect(mockAssetRepository.findBy).toHaveBeenCalledWith(where);
    });
  });

  describe('handleAssetAssigned', () => {
    it('should detect explicit content and delete asset if found', async () => {
      const assetId = 'asset-123';
      const mockAsset = {
        id: assetId,
        key: 'assets/asset-123',
      } as Asset;

      mockRekognitionService.detectExplicitContent.mockResolvedValue({
        explicit: true,
        labels: ['Explicit Nudity'],
      });

      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockAssetRepository.delete.mockResolvedValue({ affected: 1 });

      await service['handleAssetAssigned']({
        asset: mockAsset,
      });

      expect(mockRekognitionService.detectExplicitContent).toHaveBeenCalledWith(
        'assets/asset-123',
      );
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('assets/asset-123');
      expect(mockAssetRepository.delete).toHaveBeenCalledWith(assetId);
    });

    it('should not delete asset if no explicit content detected', async () => {
      const assetId = 'asset-123';
      const mockAsset = {
        id: assetId,
        key: 'assets/asset-123',
      } as Asset;

      mockRekognitionService.detectExplicitContent.mockResolvedValue({
        explicit: false,
        labels: [],
      });

      await service['handleAssetAssigned']({
        asset: mockAsset,
      });

      expect(mockRekognitionService.detectExplicitContent).toHaveBeenCalledWith(
        'assets/asset-123',
      );
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(mockAssetRepository.delete).not.toHaveBeenCalled();
    });

    it('should skip moderation for non-image assets', async () => {
      const videoAsset = {
        id: 'asset-video',
        key: 'assets/asset-video',
        type: AssetType.PostVideo,
      } as Asset;

      const documentAsset = {
        id: 'asset-doc',
        key: 'files/asset-doc',
        type: AssetType.TenantDocument,
      } as Asset;

      await service['handleAssetAssigned']({ asset: videoAsset });
      await service['handleAssetAssigned']({ asset: documentAsset });

      expect(
        mockRekognitionService.detectExplicitContent,
      ).not.toHaveBeenCalled();
      expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
      expect(mockAssetRepository.delete).not.toHaveBeenCalled();
    });
  });
});
