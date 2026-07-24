import { Branch } from './entities/branch.entity';

export enum BranchEvent {
  BRANCH_CREATED = 'branch.created',
  BRANCH_UPDATED = 'branch.updated',
  BRANCH_DELETED = 'branch.deleted',
}

export class BranchEventPayload {
  branch: Branch;
}
