import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from "react-native";

export type EmptyStateProps = {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideImageStyle?: StyleProp<ImageStyle>;
};
