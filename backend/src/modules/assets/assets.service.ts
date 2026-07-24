import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Asset, AssetType } from './entities/asset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, LessThan, Not, Repository } from 'typeorm';
import { S3Service } from 'src/modules/shared/services/s3.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ASSET_NOT_FOUND } from '../shared/error-codes';
import type { SessionUser } from '../auth/@types/session';
import { S3SignedUrlResponse } from './dto/s3-signed-url-response';
import { RekognitionService } from './rekognition.service';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { type AssetAssignedEvent, AssetEvent } from './assets.events';
import { GenerateUrlDto } from './dto/generate-url.dto';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';

@Injectable()
export class AssetsService {
  private readonly cdnUrl: string;
  private readonly unassignUpdate: Partial<Asset> = {
    used: null,
    resourceId: null,
    type: null,
  };
  private readonly S3_PROTECTED_ASSET_TYPES = [AssetType.TenantDocument];
  private readonly logger = new Logger(AssetsService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly s3Service: S3Service,
    private readonly rekognitionService: RekognitionService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.cdnUrl = this.configService.get('aws.cdnUrl');
  }

  private getAssetTypeToFileType(type: AssetType) {
    switch (type) {
      case AssetType.ProfilePicture:
      case AssetType.CoverPicture:
      case AssetType.BranchLogo:
      case AssetType.BranchCover:
      case AssetType.CourtImage:
      case AssetType.PostImage:
      case AssetType.TenantLogo:
        return 'image';
      case AssetType.BranchVideo:
      case AssetType.CourtVideo:
      case AssetType.PostVideo:
        return 'video';
      case AssetType.TenantDocument:
        return 'application';
    }
  }

  async unassignAssets(ids: string[]) {
    await this.assetRepository.update({ id: In(ids) }, this.unassignUpdate);
  }

  async unassignAssetsByResource(resourceId: string, type: AssetType) {
    await this.assetRepository.update(
      { resourceId, type },
      this.unassignUpdate,
    );
  }

  async generateUploadUrl(
    data: GenerateUrlDto,
    user: SessionUser,
  ): Promise<S3SignedUrlResponse> {
    const id = uuidv4();
    const key = await this.getAssetKey(id, data.type);
    const s3Response = await this.s3Service.generateUploadUrl({
      ...data,
      key,
      fileType: this.getAssetTypeToFileType(data.type),
    });
    const asset = await this.assetRepository.save({
      id,
      key,
      bucket: this.configService.get('aws.bucketName'),
      uploadedBy: user.id,
    });
    return { s3: s3Response, id: asset.id, assetUrl: this.getUrl(asset.id) };
  }

  @Transactional()
  async assignAssets(
    assetIds: string[] | string,
    resourceId: string,
    type: AssetType,
  ) {
    const isMultipleAssets = Array.isArray(assetIds);
    const assets = await this.assetRepository.find({
      where: {
        id: isMultipleAssets ? In(assetIds) : assetIds,
      },
    });

    if (assets.length !== (isMultipleAssets ? assetIds.length : 1)) {
      throw new NotFoundException(ASSET_NOT_FOUND);
    }

    const existingAssets = await this.assetRepository.find({
      where: {
        resourceId,
        type,
      },
    });

    const unusedAssets = existingAssets.filter(
      (existingAsset) =>
        !isMultipleAssets || !assetIds.includes(existingAsset.id),
    );

    if (unusedAssets.length > 0) {
      await this.unassignAssets(unusedAssets.map((asset) => asset.id));
    }

    for (const asset of assets) {
      asset.resourceId = resourceId;
      asset.type = type;
      asset.position = isMultipleAssets ? assetIds.indexOf(asset.id) : null;
      asset.used = true;
      await this.assetRepository.save(asset);
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(AssetEvent.ASSET_ASSIGNED, {
          asset,
        } satisfies AssetAssignedEvent);
      });
    }

    return assets.map((asset) => ({
      url: this.getUrl(asset.id),
      id: asset.id,
    }));
  }
  private isProtectedAssetType(type: AssetType) {
    return this.S3_PROTECTED_ASSET_TYPES.includes(type);
  }

  getUrl(assetId: string) {
    return `${this.cdnUrl}/assets/${assetId}`;
  }
  private async getAssetKey(id: string, type: AssetType) {
    return this.isProtectedAssetType(type) ? `files/${id}` : `assets/${id}`;
  }

  async find(where: FindOptionsWhere<Asset>) {
    return this.assetRepository.findBy(where);
  }

  async cleanUp() {
    const assets = await this.assetRepository.find({
      where: {
        used: Not(true),
        updatedAt: LessThan(new Date(Date.now() - 1000 * 60 * 60 * 2)),
      },
      take: 50,
      order: {
        updatedAt: 'ASC',
      },
    });

    await Promise.all(
      assets.map(async (asset) => {
        await this.delete(asset);
        this.logger.log(`Deleted asset ${asset.id}`);
      }),
    );
  }

  async delete(idOrAsset: string | Asset) {
    let asset: Asset;
    if (typeof idOrAsset === 'string') {
      asset = await this.assetRepository.findOne({ where: { id: idOrAsset } });
      if (!asset) {
        throw new NotFoundException(ASSET_NOT_FOUND);
      }
    } else {
      asset = idOrAsset;
    }

    await Promise.allSettled([
      this.s3Service.deleteFile(asset.key),
      this.assetRepository.delete(asset.id),
    ]);

    return asset;
  }

  async getById(id: string) {
    return this.assetRepository.findOneBy({ id });
  }
  async exists(id: string) {
    return this.assetRepository.exists({ where: { id } });
  }

  @OnEvent(AssetEvent.ASSET_ASSIGNED)
  private async handleAssetAssigned({ asset }: AssetAssignedEvent) {
    try {
      const { explicit, labels } =
        await this.rekognitionService.detectExplicitContent(asset.key);
      if (explicit) {
        this.logger.warn(`Explicit content detected for asset: ${asset.id}`);
        await this.delete(asset.id);

        return;
      }
    } catch (error) {
      this.logger.error(
        `Failed to detect explicit content for asset: ${asset.id}`,
        error,
      );
    }
  }

  @Cron('0 */2 * * *')
  private async handleCleanUp() {
    this.logger.log('Cleaning up assets');
    await this.cleanUp();
  }
}
