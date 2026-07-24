import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class CdnService {
  private readonly client: CloudFrontClient;
  constructor(private readonly configService: ConfigService) {
    this.client = new CloudFrontClient({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
  }

  async invalidate(pathOrPaths: string | string[]) {
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    await this.client.send(
      new CreateInvalidationCommand({
        DistributionId: this.configService.get('aws.cloudfrontDistributionId'),
        InvalidationBatch: {
          CallerReference: uuidv4(),
          Paths: {
            Quantity: paths.length,
            Items: paths,
          },
        },
      }),
    );
  }
}
