import { StyleProp, ViewStyle } from "react-native";
import { SportFilterItem } from "utils";

export type SportChipsProps = {
  overrideStyle?: StyleProp<ViewStyle>;
  overrideScrollStyle?: StyleProp<ViewStyle>;
  withAllSports?: boolean;
  withViewWrapper?: boolean;
  onSportPress?: (sport: SportFilterItem[]) => void;
  multipleSelection?: boolean;
};
