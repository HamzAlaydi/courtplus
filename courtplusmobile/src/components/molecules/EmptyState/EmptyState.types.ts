import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from "react-native";

export type EmptyStateProps = {
  image: ImageSourcePropType;
  title: string;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideImageStyle?: StyleProp<ImageStyle>;
};
