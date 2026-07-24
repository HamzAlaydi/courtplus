import { Booking } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type OpenMatchItemProps = {
  booking: Booking;
  overrideStyle?: StyleProp<ViewStyle>;
  onBookNowPress: () => void;
  showBookNowButton?: boolean;
};
