import { Test, TestingModule } from '@nestjs/testing';
import { RekognitionService } from './rekognition.service';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';

jest.mock('@aws-sdk/client-rekognition');

describe('RekognitionService', () => {
  let service: RekognitionService;
  let mockSend: jest.Mock;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockSend = jest.fn();

    (RekognitionClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RekognitionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RekognitionService>(RekognitionService);

    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        'aws.region': 'us-east-1',
        'aws.accessKeyId': 'test-access-key',
        'aws.secretAccessKey': 'test-secret-key',
        'aws.bucketName': 'test-bucket',
      };
      return config[key];
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectExplicitContent', () => {
    it('should detect explicit content', async () => {
      const key = 'assets/image.jpg';

      mockSend.mockResolvedValue({
        ModerationLabels: [
          {
            Name: 'Explicit Nudity',
            ParentName: 'Explicit Nudity',
            Confidence: 95,
          },
          {
            Name: 'Suggestive Content',
            ParentName: 'Suggestive',
            Confidence: 90,
          },
        ],
      });

      const result = await service.detectExplicitContent(key);

      expect(result).toEqual({
        explicit: true,
        labels: ['Explicit Nudity', 'Suggestive Content'],
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(DetectModerationLabelsCommand),
      );
    });

    it('should return no explicit content for safe images', async () => {
      const key = 'assets/safe-image.jpg';

      mockSend.mockResolvedValue({
        ModerationLabels: [],
      });

      const result = await service.detectExplicitContent(key);

      expect(result).toEqual({
        explicit: false,
        labels: [],
      });
    });


    it('should use custom bucket if provided', async () => {
      const key = 'assets/image.jpg';
      const customBucket = 'custom-bucket';

      mockSend.mockResolvedValue({
        ModerationLabels: [],
      });

      await service.detectExplicitContent(key, customBucket);

      expect(mockSend).toHaveBeenCalledWith(
        expect.any(DetectModerationLabelsCommand),
      );
    });

    it('should handle labels with missing names', async () => {
      const key = 'assets/image.jpg';

      mockSend.mockResolvedValue({
        ModerationLabels: [
          {
            Name: undefined,
            ParentName: 'Explicit Nudity',
            Confidence: 95,
          },
          {
            Name: 'Suggestive',
            ParentName: 'Suggestive',
            Confidence: 90,
          },
        ],
      });

      const result = await service.detectExplicitContent(key);

      expect(result).toEqual({
        explicit: true,
        labels: ['', 'Suggestive'],
      });
    });

    it('should handle AWS SDK errors', async () => {
      const key = 'assets/image.jpg';
      const error = new Error('Rekognition API error');

      mockSend.mockRejectedValue(error);

      await expect(service.detectExplicitContent(key)).rejects.toThrow(
        'Rekognition API error',
      );
    });

    it('should handle response with undefined ModerationLabels', async () => {
      const key = 'assets/image.jpg';

      mockSend.mockResolvedValue({
        ModerationLabels: undefined,
      });

      const result = await service.detectExplicitContent(key);

      expect(result).toEqual({
        explicit: false,
        labels: [],
      });
    });
  });
});
