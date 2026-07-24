export enum UserEvent {
  EMAIL_VERIFIED = 'user.email.verified',
}

export interface EmailVerifiedPayload {
  email: string;
  userId: string;
}
