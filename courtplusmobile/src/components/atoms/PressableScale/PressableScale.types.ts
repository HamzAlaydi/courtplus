import { PressableProps, StyleProp, ViewStyle } from "react-native";

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. Defaults to 0.96. */
  scaleTo?: number;
  /** Turns the scale feedback off while keeping the press handlers. */
  disableScale?: boolean;
};
