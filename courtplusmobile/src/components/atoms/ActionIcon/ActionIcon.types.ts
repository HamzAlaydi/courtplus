import { StyleProp, ViewStyle } from "react-native";
import { Images } from "theme";

export type ActionIconProps = {
  icon: keyof typeof Images;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
};
