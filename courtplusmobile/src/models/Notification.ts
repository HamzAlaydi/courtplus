import { User } from "./User";

type NotificationType =
  | "follow"
  | "review_added"
  | "booking_cancelled"
  | "booking_invitation_accepted"
  | "booking_invitation_rejected"
  | "booking_reminder"
  | "booking_invitation"
  | "booking_entered"
  | "booking_joined"
  | "booking_created"
  | "booking_moment_posted"
  | "post_like"
  | "report_created"
  | "payment_failed"
  | "payment_success"
  | "refund_processed"
  | "booking_join_request_submitted"
  | "booking_join_request_approved"
  | "booking_join_request_rejected";

export type Notification = {
  createdAt: string;
  updatedAt: string;
  id: string;
  type: NotificationType;
  userId: string;
  resourceId?: string;
  count?: number;
  content: string;
  image: string
  title: string
  relations: {
    user: User
  },
  data: {
    bookingId?: string;
    userId?: string;
  }
};
