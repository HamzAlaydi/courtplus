import { StyleProp, ViewStyle } from "react-native";

export type DayCellProps = {
  day: Date;
  isSelected: boolean;
  onPress: () => void;
  overrideContainerStyle?: StyleProp<ViewStyle>;
};
