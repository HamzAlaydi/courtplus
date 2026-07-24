import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

export type ActionItemProps = {
  image: ImageSourcePropType;
  overrideStyle?: StyleProp<ViewStyle>;
  overrideTitleStyle?: StyleProp<TextStyle>;
  overrideImageStyle?: StyleProp<ImageStyle>;
  title: string;
  right?: React.ReactNode;
};
