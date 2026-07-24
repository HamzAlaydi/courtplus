import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from "react-native";

export type IconButtonProps = {
  icon: ImageSourcePropType;
  title: string;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideIconStyle?: StyleProp<ImageStyle>;
};
