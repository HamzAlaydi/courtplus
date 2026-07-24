import { StyleProp, ViewStyle } from "react-native";

export type LocationHeaderProps = {
  currentLocation: string;
  onPress: () => void;
  onNotificationPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  isLoading?: boolean;
  showNotification?: boolean;
};
