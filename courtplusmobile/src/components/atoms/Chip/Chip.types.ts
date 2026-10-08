import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type ChipVariant =
  /** White + line border, ink fill when selected. */
  | "default"
  /** Lime tint (sport, air conditioned, women only). */
  | "feature"
  | "success"
  | "warning"
  | "danger";

export type ChipProps = {
  title: string;
  isSelected: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideTextStyle?: StyleProp<TextStyle>;
  variant?: ChipVariant;
  /** medium 38 (default) · small 28, for chips inside cards. */
  size?: "medium" | "small";
  disabled?: boolean;
};
