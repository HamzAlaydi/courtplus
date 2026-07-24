import { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

export type StatusViewProps = {
  image: ImageSourcePropType;
  secondImage?: ImageSourcePropType;
  title: string;
  buttonTitle: string;
  onButtonPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
};
