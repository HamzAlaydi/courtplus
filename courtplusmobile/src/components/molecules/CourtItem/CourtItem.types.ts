import { Court } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type CourtItemProps = {
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  item: Court;
  showBottomInfo?: boolean;
};
