import { SetMetadata } from '@nestjs/common';
import { UserType } from 'src/modules/auth/@types/user.type';
import { StaffRole } from 'src/modules/staff/entities/enum';

export const ROLES_KEY = '__roles__';

export type AuthorizedUserTypeMetadata = {
  userTypes: UserType[];
  canAccess: boolean;
  roles?: StaffRole[];
};
export class AuthorizedUserType {
  static is(userTypes: UserType[], roles?: StaffRole[]) {
    return SetMetadata<string, AuthorizedUserTypeMetadata>(ROLES_KEY, {
      userTypes,
      canAccess: true,
      roles,
    });
  }

  static not(...userTypes: UserType[]) {
    return SetMetadata<string, AuthorizedUserTypeMetadata>(ROLES_KEY, {
      userTypes,
      canAccess: false,
    });
  }

  static isStaff(roles?: StaffRole[]) {
    return this.is([UserType.Staff], roles);
  }

  static isCustomer(roles?: StaffRole[]) {
    return this.is([UserType.Customer], roles);
  }
}
