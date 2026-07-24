import { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

export type SessionOverviewProps = {
  sessions: { title: string; subtitle: string; image: ImageSourcePropType }[];
  overrideContainerStyle?: StyleProp<ViewStyle>;
  overrideColumnStyle?: StyleProp<ViewStyle>;
  isDividerBlack?: boolean;
};
