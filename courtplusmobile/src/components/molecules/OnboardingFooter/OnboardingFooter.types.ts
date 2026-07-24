import { StyleProp, ViewStyle } from "react-native";

export type OnboardingFooterProps = {
  onPress: () => void;
  type: "login" | "register";
  overrideStyle?: StyleProp<ViewStyle>;
};
