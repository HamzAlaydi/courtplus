import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { AccountProvider } from './entities/account.entity';

export enum AuthEvent {
  USER_CREATED = 'user.created',
  FORGOT_PASSWORD = 'forgot.password',
  PASSWORD_CHANGED = 'password.changed',
  USER_VERIFIED = 'user.verified',
}

export interface UserCreatedEvent {
  user: Staffer | User;
  provider: AccountProvider;
  invited?: boolean;
}

export interface ForgotPasswordEvent {
  user: Staffer;
  code: string;
}

export interface UserPayload {
  user: Staffer | User;
}

export interface UserLoggedInEvent {
  user: Staffer | User;
  ip: string;
  userAgent: string;
}
