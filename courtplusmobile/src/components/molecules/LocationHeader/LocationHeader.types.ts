import { StyleProp, ViewStyle } from "react-native";

export type LocationHeaderVariant =
  /** Ground or white screens: white pill with a line border, white bell. */
  | "light"
  /** Ink header band: translucent pill and bell, lime pin. */
  | "dark";

export type LocationHeaderProps = {
  currentLocation: string;
  onPress: () => void;
  onNotificationPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  showNotification?: boolean;
  /** Defaults to "light". */
  variant?: LocationHeaderVariant;
  /** Rendered after the bell (e.g. the profile avatar on Home). */
  trailingComponent?: React.ReactNode;
};
