import { StyleProp, ViewStyle } from "react-native";

export type HorizontalDatePickerProps = {
  onDayPress: (date: Date) => void;
  overrideContainerStyle?: StyleProp<ViewStyle>;
  selectedDate: Date;
};
