import { User } from "./User";

export type MatchEvent = {
  createdAt: string;
  updatedAt: string;
  id: string;
  bookingId: string;
  userId: string;
  data: string;
  event: string;
  deletedAt: string;
  user: User;
};
