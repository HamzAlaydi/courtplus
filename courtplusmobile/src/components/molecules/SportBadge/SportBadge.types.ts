import { Sport } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type SportBadgeProps = {
  sport: Sport;
  overrideStyle?: StyleProp<ViewStyle>;
};
