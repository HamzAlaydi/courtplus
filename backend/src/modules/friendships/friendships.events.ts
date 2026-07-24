import type { SessionUser } from '../auth/@types/session';

export enum FriendshipEventType {
  FOLLOW = 'friendship.follow',
  UNFOLLOW = 'friendship.unfollow',
}

export interface FriendshipEvent {
  followerId: string;
  followingId: string;
}
