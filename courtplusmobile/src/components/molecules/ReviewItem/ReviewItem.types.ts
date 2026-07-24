import { Review } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type ReviewItemProps = {
  item: Review;
  overrideStyle?: StyleProp<ViewStyle>;
};
