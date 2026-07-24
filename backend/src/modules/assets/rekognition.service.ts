import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from '@aws-sdk/client-rekognition';

@Injectable()
export class RekognitionService {
  private readonly rekognition: RekognitionClient;
  private readonly minConfidence = 80;

  constructor(private readonly configService: ConfigService) {
    this.rekognition = new RekognitionClient({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
  }

  async detectExplicitContent(
    key: string,
    bucket?: string,
  ): Promise<{ explicit: boolean; labels: string[] }> {
    const result = await this.rekognition.send(
      new DetectModerationLabelsCommand({
        Image: {
          S3Object: {
            Bucket: bucket ?? this.configService.get('aws.bucketName'),
            Name: key,
          },
        },
        MinConfidence: this.minConfidence,
      }),
    );
    const explicitLabels = (result.ModerationLabels || []).filter(
      (label) =>
        label.ParentName === 'Explicit Nudity' ||
        label.ParentName === 'Suggestive' ||
        label.ParentName === 'Drugs & Tobacco',
    );
    const labels = explicitLabels.map((label) => label.Name || '');
    const explicit = labels.length > 0;
    return { explicit, labels };
  }
}
