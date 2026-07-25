import { CommonActions } from "@react-navigation/native";
import { navigationRef } from "navigation/types";

/**
 * Normalized payload used to decide where a notification should navigate.
 * `kind` is the backend NotificationType string (e.g. "court_approved").
 */
export type NotificationNavigationPayload = {
  kind?: string;
  userId?: string;
  courtId?: string;
  branchId?: string;
  bookingId?: string;
};

const bookingKinds = [
  "booking_cancelled",
  "booking_invitation",
  "booking_invitation_accepted",
  "booking_invitation_rejected",
  "booking_reminder",
  "booking_entered",
  "booking_joined",
  "booking_created",
  "booking_participant_removed",
  "booking_participant_added",
  "booking_participant_cancelled",
  "booking_started",
  "booking_ended",
  "booking_join_request_submitted",
  "booking_join_request_approved",
  "booking_join_request_rejected",
];

const paymentKinds = [
  "payment_failed",
  "payment_succeeded",
  "refund_succeeded",
  "refund_failed",
  "payment_released",
  "subscription_payment_failed",
];

const courtKinds = [
  "court_pending_payment",
  "court_pending_approval",
  "court_approved",
  "court_changes_requested",
  "court_resubmitted",
  "court_suspended",
  "court_unsuspended",
];

const branchKinds = ["branch_suspended", "branch_unsuspended"];

const notificationsRoute = () =>
  CommonActions.navigate("AuthenticatedStack", { screen: "Notifications" });

const profileRoute = (id: string) =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "Profile",
    params: { id },
  });

const activityTabRoute = () =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "MainTabs",
    params: { screen: "Activity" },
  });

const activityLogRoute = (bookingId: string) =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "ActivityStack",
    params: { screen: "ActivityLog", params: { id: bookingId } },
  });

const courtDetailsRoute = (courtId: string) =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "CourtStack",
    params: { screen: "CourtDetails", params: { id: courtId } },
  });

const courtReviewsRoute = (courtId: string) =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "CourtStack",
    params: { screen: "Reviews", params: { courtId } },
  });

const branchDetailsRoute = (branchId: string) =>
  CommonActions.navigate("AuthenticatedStack", {
    screen: "CourtStack",
    params: { screen: "BranchDetails", params: { id: branchId } },
  });

const getNotificationAction = ({
  kind,
  userId,
  courtId,
  branchId,
  bookingId,
}: NotificationNavigationPayload) => {
  if (kind === "follow" || kind === "post_like") {
    return userId ? profileRoute(userId) : notificationsRoute();
  }
  if (kind === "moment_posted") {
    if (courtId) return courtDetailsRoute(courtId);
    if (userId) return profileRoute(userId);
    return notificationsRoute();
  }
  if (kind === "review_added") {
    return courtId ? courtReviewsRoute(courtId) : notificationsRoute();
  }
  if (bookingKinds.includes(kind ?? "") || paymentKinds.includes(kind ?? "")) {
    return bookingId ? activityLogRoute(bookingId) : activityTabRoute();
  }
  if (courtKinds.includes(kind ?? "")) {
    return courtId ? courtDetailsRoute(courtId) : notificationsRoute();
  }
  if (branchKinds.includes(kind ?? "")) {
    return branchId ? branchDetailsRoute(branchId) : notificationsRoute();
  }
  // report_created, tenant_* and unknown/missing kinds.
  return notificationsRoute();
};

/**
 * Parses the raw FCM data payload. The backend sends
 * `{ type: <NotificationType>, data: <JSON string> }` (see firebase.service),
 * so the inner JSON is merged in and everything is read defensively.
 */
export const parsePushNotificationData = (
  data?: Record<string, unknown>
): NotificationNavigationPayload => {
  if (!data) return {};
  let inner: Record<string, unknown> = {};
  try {
    if (typeof data.data === "string") {
      inner = JSON.parse(data.data);
    }
  } catch {
    inner = {};
  }
  const pick = (key: string) => {
    const value = data[key] ?? inner[key];
    return typeof value === "string" && value ? value : undefined;
  };
  return {
    kind: pick("kind") ?? pick("type"),
    userId: pick("userId"),
    courtId: pick("courtId"),
    branchId: pick("branchId"),
    bookingId: pick("bookingId"),
  };
};

/** Navigates to the screen matching the notification kind. */
export const navigateToNotification = (
  payload: NotificationNavigationPayload
) => {
  if (!navigationRef.current?.isReady()) return;
  navigationRef.current.dispatch(getNotificationAction(payload));
};
