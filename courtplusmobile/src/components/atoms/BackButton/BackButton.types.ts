import { ImageStyle, StyleProp, ViewStyle } from "react-native";

export type BackButtonProps = {
  overrideStyle?: StyleProp<ViewStyle>;
  whiteColor?: boolean;
  iconStyle?: StyleProp<ImageStyle>;
};
