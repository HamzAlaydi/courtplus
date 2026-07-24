import { User } from "./User";

export type FriendShip = {
  createdAt: string;
  updatedAt: string;
  id: string;
  followerId: string;
  followingId: string;
  follower?: User;
  following?: User;
  user: User;
};
