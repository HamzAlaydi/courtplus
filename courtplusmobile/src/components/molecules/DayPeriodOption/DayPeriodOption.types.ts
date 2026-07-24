import { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

export type DayPeriodOptionProps = {
  image: ImageSourcePropType;
  name: string;
  time: string;
  onPress: () => void;
  isSelected: boolean;
  overrideStyle?: StyleProp<ViewStyle>;
};
