import { t } from "i18next";
import {
  Booking,
  MatchStatus,
  Participant,
  ParticipantStatus,
  PaymentStatus,
} from "models";

export type BookingStatusPill = {
  title: string;
  variant: "feature" | "success" | "warning" | "danger";
};

/** Booking payment states that mean every seat is paid for. */
const SETTLED_PAYMENT_STATUSES: string[] = [
  PaymentStatus.COMPLETED,
  PaymentStatus.PAID,
];

/** What the screen knows about the person looking at the booking. */
export type BookingViewer = {
  /** The viewer's own seat, when the profile has loaded. */
  participant?: Participant;
  /** The viewer paid on this screen after the booking snapshot was taken. */
  hasJustPaid?: boolean;
};

/**
 * Whether the booking still waits for money. With a known viewer it is their
 * own seat (the same check as the "Pay your part" button); otherwise it is the
 * booking as a whole, which split bookings only settle once every seat is paid.
 */
export const isAwaitingPayment = (item: Booking, viewer?: BookingViewer) => {
  if (viewer?.hasJustPaid) {
    return false;
  }
  if (viewer?.participant) {
    return viewer.participant.status === ParticipantStatus.PENDING_PAYMENT;
  }
  return (
    !!item.paymentStatus &&
    !SETTLED_PAYMENT_STATUSES.includes(item.paymentStatus)
  );
};

/**
 * The status pill shown on the bookings list card, the booking details and
 * the ticket, so all three agree for the same viewer. Purely presentational:
 * it reads the booking as the screen received it, so an unpaid booking is
 * labelled Unpaid rather than Upcoming.
 */
export const getBookingStatusPill = (
  item: Booking,
  viewer?: BookingViewer
): BookingStatusPill | null => {
  if (item.status === MatchStatus.CANCELLED) {
    return {
      title: t("activity.status.cancelled", {
        defaultValue: "Cancelled",
      }),
      variant: "danger",
    };
  }
  if (item.status === MatchStatus.COMPLETED) {
    return {
      title: t("activity.status.completed", {
        defaultValue: "Completed",
      }),
      variant: "success",
    };
  }
  const now = Date.now();
  if (new Date(item.endDate).getTime() <= now) {
    return null;
  }
  if (isAwaitingPayment(item, viewer)) {
    return {
      title: t("activity.unpaid"),
      variant: "warning",
    };
  }
  if (new Date(item.startDate).getTime() > now) {
    return {
      title: t("activity.status.upcoming", {
        defaultValue: "Upcoming",
      }),
      variant: "feature",
    };
  }
  return {
    title: t("activity.status.inProgress", {
      defaultValue: "In progress",
    }),
    variant: "warning",
  };
};
