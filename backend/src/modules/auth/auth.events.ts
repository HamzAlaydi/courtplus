import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { AccountProvider } from './entities/account.entity';

export enum AuthEvent {
  USER_CREATED = 'user.created',
  FORGOT_PASSWORD = 'forgot.password',
  PASSWORD_CHANGED = 'password.changed',
  USER_VERIFIED = 'user.verified',
  // A session ended (logout, password change, admin action). Consumers drop
  // per-user caches such as the push-token list.
  SESSIONS_REVOKED = 'sessions.revoked',
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
  /**
   * Session to keep alive. A self-service password change should sign the
   * OTHER devices out, not the one doing the changing; a forgot-password
   * reset passes nothing and ends every session.
   */
  exceptSid?: string;
}

export interface UserLoggedInEvent {
  user: Staffer | User;
  ip: string;
  userAgent: string;
}
