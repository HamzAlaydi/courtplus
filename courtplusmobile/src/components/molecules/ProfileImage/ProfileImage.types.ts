import { StyleProp, ViewStyle } from "react-native";

export type ProfileImageProps = {
  image?: string;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  showCamera?: boolean;
};
