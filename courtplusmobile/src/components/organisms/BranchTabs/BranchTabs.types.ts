import { Court } from "models";
import { StyleProp, ViewStyle } from "react-native";
import { Item } from "utils";

export type BranchTabsProps = {
  onCourtPress?: (court: Court) => void;
  tabs: Item[];
  courts: Court[];
  overrideStyle?: StyleProp<ViewStyle>;
};
