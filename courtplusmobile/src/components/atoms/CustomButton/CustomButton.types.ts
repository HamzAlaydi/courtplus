import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type CustomButtonVariant =
  /** Lime pill, ink label in the display face (main call to action). */
  | "primary"
  /** Ink pill, white label. */
  | "secondary"
  /** White pill, 1px line border, ink label. */
  | "outline"
  /** Transparent, ink label. */
  | "ghost"
  /** Danger-tinted pill for destructive actions. */
  | "danger"
  /** Legacy alias of "primary". */
  | "active"
  /** Legacy alias of "secondary". */
  | "dark"
  /** Transparent pill with a line border and muted label (inactive look). */
  | "bordered"
  /** Underlined text link. */
  | "link"
  /** Transparent pill with a line border and faint label. */
  | "disabled"
  /** Filled grey pill with faint label. */
  | "disabledDark";

export type CustomButtonSize = "large" | "medium" | "small";

export type CustomButtonProps = {
  title: string;
  onPress: () => void;
  variant?: CustomButtonVariant;
  /** large 54 (default) · medium 48 · small 40. */
  size?: CustomButtonSize;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideTextStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};
