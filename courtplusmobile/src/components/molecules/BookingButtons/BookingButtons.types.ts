export type BookingButtonsProps = {
  onCancelPress: () => void;
  onNextPress: () => void;
  amount?: number;
  rightButtonTitle?: string;
  isRightButtonDisabled?: boolean;
};
