import { BaseEntity } from 'src/common/base-entity';
import { AfterLoad, Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AssetType {
  ProfilePicture = 'profile_picture',
  CoverPicture = 'cover_picture',
  BranchLogo = 'branch_logo',
  BranchCover = 'branch_cover',
  BranchVideo = 'branch_video',
  CourtImage = 'court_image',
  CourtVideo = 'court_video',
  PostImage = 'post_image',
  PostVideo = 'post_video',
  TenantDocument = 'tenant_document',
  TenantLogo = 'tenant_logo',
}

@Entity('assets')
@Index('idx_asset_createdAt_used', ['createdAt', 'used'])
@Index('idx_asset_resourceId_type', ['resourceId', 'type'])
export class Asset extends BaseEntity {
  @ApiProperty({
    description: 'The URL where the asset can be accessed',
    example: 'https://example.com/assets/image.jpg',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'The size of the asset file in bytes',
    example: 1024,
    required: false,
  })
  @Column({ nullable: true })
  fileSize?: number;

  @ApiProperty({
    description: 'The MIME type of the asset',
    example: 'image/jpeg',
    required: false,
  })
  @Column({ nullable: true })
  mimeType?: string;

  @Column()
  bucket: string;

  @Column({ unique: true })
  key: string;

  @Column({ nullable: true })
  used?: boolean;

  @Column('uuid', { nullable: true })
  resourceId?: string;

  @Column({ nullable: true })
  position?: number;

  @Column({
    nullable: true,
    type: 'enum',
    enum: AssetType,
    enumName: 'AssetType',
  })
  type?: AssetType;

  @Column({ nullable: true, type: 'uuid' })
  uploadedBy?: string;

  /**
   * `url` is not persisted — derive the CDN URL on every load so consumers
   * always receive a usable link regardless of which query fetched the asset.
   * Declared optional so spread-mapped asset objects (`{ ...asset, url }`)
   * remain assignable to `Asset`.
   */
  @AfterLoad()
  setCdnUrl?() {
    if (!this.url) {
      const cdnUrl = process.env.AWS_CDN_URL;
      if (cdnUrl && this.id) {
        this.url = `${cdnUrl}/assets/${this.id}`;
      }
    }
  }
}
