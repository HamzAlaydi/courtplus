import { UserType } from './user.type';
import { StaffRole } from 'src/modules/staff/entities/enum';
export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  type: UserType;
  role?: StaffRole;
  sid: string;
  tenantId?: string;
  deviceId?: string;
};

export type RefreshTokenPayload = {
  id: string;
  sid: string;
  type: UserType;
  role?: StaffRole;
  deviceId?: string;
};
