import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type ChipProps = {
  title: string;
  isSelected: boolean;
  leftComponent?: React.ReactNode;
  onPress?: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideTextStyle?: StyleProp<TextStyle>;
};
