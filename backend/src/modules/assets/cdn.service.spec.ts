import { Test, TestingModule } from '@nestjs/testing';
import { CdnService } from './cdn.service';
import { ConfigService } from '@nestjs/config';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

jest.mock('@aws-sdk/client-cloudfront');

describe('CdnService', () => {
  let service: CdnService;
  let mockSend: jest.Mock;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockSend = jest.fn().mockResolvedValue({});

    (CloudFrontClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CdnService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CdnService>(CdnService);

    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'aws.region': 'us-east-1',
        'aws.accessKeyId': 'test-access-key',
        'aws.secretAccessKey': 'test-secret-key',
        'aws.cloudfront.distributionId': 'test-distribution-id',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invalidate', () => {
    it('should invalidate single path', async () => {
      const path = '/assets/image.jpg';

      await service.invalidate(path);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.any(CreateInvalidationCommand),
      );
    });

    it('should invalidate multiple paths', async () => {
      const paths = ['/assets/image1.jpg', '/assets/image2.jpg'];

      await service.invalidate(paths);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.any(CreateInvalidationCommand),
      );
    });
  });
});
