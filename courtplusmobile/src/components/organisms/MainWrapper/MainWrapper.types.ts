import { StyleProp, ViewStyle } from "react-native";
import { RefreshControlProps } from "react-native";

export type MainWrapperProps = {
  children: React.ReactNode;
  scrollEnabled?: boolean;
  overrideContainerStyle?: StyleProp<ViewStyle>;
  overrideContentStyle?: StyleProp<ViewStyle>;
  enableSafeArea?: boolean;
  whiteBackground?: boolean;
  disableBottomPadding?: boolean;
  /** Only applied when `scrollEnabled` is true. */
  refreshControl?: React.ReactElement<RefreshControlProps>;
};
