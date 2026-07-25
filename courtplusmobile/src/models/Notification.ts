import { User } from "./User";

// Mirrors the backend NotificationType enum
// (backend/src/modules/notifications/entities/notification.entity.ts)
type NotificationType =
  | "follow"
  | "booking_cancelled"
  | "booking_invitation_accepted"
  | "booking_invitation_rejected"
  | "booking_reminder"
  | "booking_invitation"
  | "booking_entered"
  | "booking_joined"
  | "booking_created"
  | "booking_participant_removed"
  | "booking_participant_added"
  | "booking_participant_cancelled"
  | "booking_started"
  | "booking_ended"
  | "booking_join_request_submitted"
  | "booking_join_request_approved"
  | "booking_join_request_rejected"
  | "review_added"
  | "payment_failed"
  | "payment_succeeded"
  | "refund_succeeded"
  | "refund_failed"
  | "payment_released"
  | "moment_posted"
  | "post_like"
  | "report_created"
  | "court_pending_payment"
  | "court_pending_approval"
  | "court_approved"
  | "court_changes_requested"
  | "court_resubmitted"
  | "court_suspended"
  | "court_unsuspended"
  | "branch_suspended"
  | "branch_unsuspended"
  | "tenant_suspended"
  | "tenant_unsuspended"
  | "tenant_unsuspend_requested"
  | "subscription_payment_failed";

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
    courtId?: string;
    branchId?: string;
    reviewId?: string;
    postId?: string;
    kind?: string;
  }
};
