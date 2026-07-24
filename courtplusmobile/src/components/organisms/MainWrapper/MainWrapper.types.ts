import { StyleProp, ViewStyle } from "react-native";

export type MainWrapperProps = {
  children: React.ReactNode;
  scrollEnabled?: boolean;
  overrideContainerStyle?: StyleProp<ViewStyle>;
  overrideContentStyle?: StyleProp<ViewStyle>;
  enableSafeArea?: boolean;
  whiteBackground?: boolean;
  disableBottomPadding?: boolean;
};
