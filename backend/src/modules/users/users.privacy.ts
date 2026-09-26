import { User } from './entities/user.entity';
import { SessionUser } from '../auth/@types/session';
import { UserType } from '../auth/@types/user.type';

/**
 * Fields that must never reach another customer.
 *
 * GET /users and GET /users/:id returned the full User entity to any
 * authenticated caller, so any customer could walk the id space (or page the
 * search endpoint) and harvest every user's email, phone number, date of
 * birth, Firebase UID and Stripe customer id. The entity carries no @Exclude
 * decorators, so the global ClassSerializerInterceptor had nothing to strip.
 */
const PRIVATE_FIELDS = [
  'email',
  'pendingEmail',
  'emailVerified',
  'phoneNumber',
  'pendingPhoneNumber',
  'dateOfBirth',
  'firebaseUid',
  'stripeCustomerId',
] as const;

/**
 * Staff and ops legitimately need contact details to service a booking, so
 * only customer-to-customer reads are redacted. Viewing your own record is
 * always full-fidelity.
 */
export function redactUserForViewer<T extends Partial<User>>(
  user: T,
  viewer: SessionUser,
): T {
  if (!user) return user;
  if (viewer?.type !== UserType.Customer) return user;
  if (viewer?.id === (user as Partial<User>).id) return user;

  const redacted = { ...user } as Record<string, unknown>;
  for (const field of PRIVATE_FIELDS) {
    delete redacted[field];
  }
  return redacted as T;
}

export function redactUsersForViewer<T extends Partial<User>>(
  users: T[],
  viewer: SessionUser,
): T[] {
  return (users ?? []).map((u) => redactUserForViewer(u, viewer));
}
