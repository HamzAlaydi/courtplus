import { omit } from 'lodash';
import { Staffer } from './entities/staff.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';

export function sanitizeStaff(staff: Staffer) {
  return omit(staff, ['password', 'lastPasswordChangeAt']);
}

export function sanitizeStaffInvitation(invitation: StaffInvitation) {
  return omit(invitation, ['token']);
}
