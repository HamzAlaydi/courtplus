import _ from 'lodash';
import { User } from 'src/modules/users/entities/user.entity';

export const sanitizeUser = (user: User) => {
  return _.omit(user, ['firebaseUid']);
};
