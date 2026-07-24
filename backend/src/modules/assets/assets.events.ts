import { Asset } from './entities/asset.entity';

export enum AssetEvent {
  ASSET_ASSIGNED = 'asset.assigned',
  ASSET_UNASSIGNED = 'asset.unassigned',
  ASSET_DELETED = 'asset.deleted',
}

export interface AssetAssignedEvent {
  asset: Asset;
}
