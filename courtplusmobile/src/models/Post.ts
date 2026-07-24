import { Asset } from "./Court";
import { User } from "./User";

export type Post = {
  createdAt: string;
  updatedAt: string;
  id: string;
  body: string;
  bookingId: string;
  userId: string;
  assetId: string;
  likesCount: number;
  user: User;
  asset: Asset;
  isLiked: boolean;
  assetUrl: string;
};
