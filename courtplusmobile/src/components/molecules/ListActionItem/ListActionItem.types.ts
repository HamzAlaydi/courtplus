import {
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ActionListItem } from "utils";

export type ListActionItemProps = {
  list: ActionListItem[];
  overrideContainerStyle?: StyleProp<ViewStyle>;
  overrideTextStyle?: StyleProp<TextStyle>;
  overrideImageStyle?: StyleProp<ImageStyle>;
  showSeparator?: boolean;
};
