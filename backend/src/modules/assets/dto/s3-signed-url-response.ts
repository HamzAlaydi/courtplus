import { ApiProperty } from '@nestjs/swagger';
import { S3PresignedUploadResult } from 'src/modules/shared/@types/s3';

export class S3SignedUrlResponse {
  @ApiProperty({
    type: 'string',
    description:
      'The asset id. This can be used to assign the asset to a resource',
  })
  id: string;

  @ApiProperty({
    type: 'string',
    description: 'The asset url. This can be used to display the asset',
  })
  assetUrl: string;

  @ApiProperty({
    type: S3PresignedUploadResult,
    description: 'The S3 presigned upload result',
  })
  s3: S3PresignedUploadResult;
}
