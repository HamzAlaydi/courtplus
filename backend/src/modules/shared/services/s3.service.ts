import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  S3Client,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import {
  createPresignedPost,
  PresignedPost,
  PresignedPostOptions,
} from '@aws-sdk/s3-presigned-post';
import { rfc2047EncodeMetadata } from '../util';
import { MIMETYPE_REQUIRED, STORAGE_SERVICE_UNAVAILABLE } from 'src/modules/shared/error-codes';
import { S3PresignedUploadOptions } from '../@types/s3';
import { S3PresignedUploadResult } from '../@types/s3';

export const WildcardContentType = {
  image: 'image/',
  video: 'video/',
  document: 'application/pdf',
  audio: 'audio/',
};

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: configService.get('aws.region'),
      credentials: {
        accessKeyId: configService.get('aws.accessKeyId'),
        secretAccessKey: configService.get('aws.secretAccessKey'),
      },
    });
    this.bucketName = configService.get('aws.bucketName');
  }

  // Generating a presigned upload URL
  async generateUploadUrl(
    options: S3PresignedUploadOptions,
  ): Promise<S3PresignedUploadResult> {
    const {
      key,
      bucket,
      metadata,
      mimetype,
      fileType,
      maxFileSize = 10 * 1024 * 1024,
      expiresIn = 60 * 60,
    } = options;

    if (!mimetype && !fileType) {
      throw new BadRequestException(MIMETYPE_REQUIRED);
    }

    const bucketName = bucket || this.bucketName;

    const conditions: any[] = [['content-length-range', 0, maxFileSize]];

    if (fileType) {
      conditions.push([
        'starts-with',
        '$Content-Type',
        WildcardContentType[fileType],
      ]);
    } else if (mimetype) {
      conditions.push({ 'Content-Type': mimetype });
    }

    const presignedPostOptions: PresignedPostOptions = {
      Bucket: bucketName,
      Key: key,
      Conditions: conditions,
      Expires: expiresIn,
    };
    if (metadata) {
      presignedPostOptions.Fields = Object.fromEntries(
        Object.entries(rfc2047EncodeMetadata(metadata)).map(([key, value]) => [
          `X-Amz-Meta-${key}`,
          value,
        ]),
      ) as Record<string, string>;
    }

    let presignedPost: PresignedPost;
    try {
      presignedPost = await createPresignedPost(this.s3, presignedPostOptions);
    } catch (error) {
      this.logger.warn(`S3 createPresignedPost failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException(STORAGE_SERVICE_UNAVAILABLE);
    }

    return {
      url: presignedPost.url,
      fields: {
        key,
        ...presignedPost.fields,
      },
      key,
    };
  }

  // Deleting a file from the S3 bucket
  async deleteFile(key: string, bucket?: string) {
    bucket = bucket || this.bucketName;
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    try {
      await this.s3.send(command);
    } catch (error) {
      this.logger.warn(`S3 deleteObject failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException(STORAGE_SERVICE_UNAVAILABLE);
    }
  }

  // Checking if a file exists in the S3 bucket
  async fileExists(key: string, bucket?: string): Promise<boolean> {
    const metadata = await this.getFileMetadata(key, bucket);
    return !!metadata;
  }

  // Getting the metadata of a file in the S3 bucket
  async getFileMetadata(key: string, bucket?: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket || this.bucketName,
        Key: key,
      });
      const response = await this.s3.send(command);
      return response;
    } catch (error) {
      return undefined;
    }
  }
}
