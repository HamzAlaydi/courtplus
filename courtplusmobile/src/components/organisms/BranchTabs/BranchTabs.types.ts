import { Court } from "models";
import { StyleProp, ViewStyle } from "react-native";
import { Item } from "utils";

export type BranchTabsProps = {
  tabs: Item[];
  courts: Court[];
  overrideStyle?: StyleProp<ViewStyle>;
};
