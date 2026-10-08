export type BookingButtonsProps = {
  onCancelPress: () => void;
  onNextPress: () => void;
  amount?: number;
  rightButtonTitle?: string;
  isRightButtonDisabled?: boolean;
  /** Caption above the total, e.g. "Total Cost · 90 mins". */
  totalLabel?: string;
  /** Total shown in the display face. Takes precedence over `amount`. */
  totalValue?: string;
  /** Unit next to the total. Defaults to the currency. */
  totalUnit?: string;
};
