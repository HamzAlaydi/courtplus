import { Slot } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type TimeSlotsProps = {
  slots: Slot[];
  onTimeSlotPress: (slot: Slot) => void;
  selectedSlots: Slot[];
  overrideStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
};
