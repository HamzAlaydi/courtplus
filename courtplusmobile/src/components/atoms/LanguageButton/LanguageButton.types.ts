import { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

export type LanguageButtonProps = {
  onPress: () => void;
  title: string;
  isSelected: boolean;
  image: ImageSourcePropType;
  overrideStyle?: StyleProp<ViewStyle>;
};
