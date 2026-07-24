import { ApiProperty } from '@nestjs/swagger';

export type S3FileType = 'image' | 'video' | 'application' | 'audio';

export interface S3FileOptions {
  bucket?: string;
  key?: string;
  metadata?: Record<string, any>;
  mimetype?: string;
}

export interface S3PresignedUploadOptions extends S3FileOptions {
  maxFileSize?: number;
  expiresIn?: number;
  fileType?: S3FileType;
}

export class S3PresignedUploadResult {
  @ApiProperty({
    type: 'string',
    description: 'The presigned upload URL',
  })
  url: string;

  @ApiProperty({
    type: 'object',
    description: 'The presigned upload fields',
    additionalProperties: false,
  })
  fields: Record<string, string>;

  @ApiProperty({
    type: 'string',
    description: 'The presigned upload key',
  })
  key: string;
}
