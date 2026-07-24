import { Court } from "./Court";
import { Booking } from "./Booking";
import { User } from "./User";

export type Review = {
  id: string;
  createdAt: string;
  rating: number;
  comment: string;
  userId: string;
  bookingId: string;
  courtId: string;
  user: User & {
    reviewsCount: number;
  };
  court: Court;
  match: Booking;
};
