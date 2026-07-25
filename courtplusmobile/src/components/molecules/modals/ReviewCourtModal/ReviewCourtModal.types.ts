export type ReviewCourtModalProps = {
  courtName: string;
  bookingId: string;
  onClose: () => void;
  /** Optional "Later" action (used by the post-game rate prompt). */
  onLater?: () => void;
  /** Optional title override (defaults to reviews.title). */
  title?: string;
};
