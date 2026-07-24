import { StyleProp, ViewStyle } from "react-native";
import { Item } from "utils";

export type TabsProps = {
  tabs: Item[];
  selectedTab: Item;
  setSelectedTab: (tab: Item) => void;
  overrideStyle?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
};
