import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from "react-native";

export type ItemIconProps = {
  icon?: string;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideImageStyle?: StyleProp<ImageStyle>;
};
