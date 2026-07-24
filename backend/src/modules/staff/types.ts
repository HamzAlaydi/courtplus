import { Staffer } from './entities/staff.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
export type ResponseStaff = Omit<Staffer, 'password' | 'lastPasswordChangeAt'>;
export type ResponseStaffInvitation = Omit<StaffInvitation, 'token'>;
