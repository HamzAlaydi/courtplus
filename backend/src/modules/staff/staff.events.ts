import { Staffer } from './entities/staff.entity';

export enum StaffEvent {
  STAFF_CREATED = 'staff.created',
  STAFF_UPDATED = 'staff.updated',
  STAFF_DELETED = 'staff.deleted',
  STAFF_ACTIVATED = 'staff.activated',
  STAFF_DEACTIVATED = 'staff.deactivated',
}

export class StaffEventPayload {
  staff: Staffer;
}