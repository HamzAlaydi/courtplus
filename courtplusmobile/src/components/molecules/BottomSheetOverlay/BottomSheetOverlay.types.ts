import { StyleProp, ViewStyle } from "react-native";

export type BottomSheetOverlayProps = {
  children: React.ReactNode;
  title?: string;
  isWhite?: boolean;
  overrideContentStyle?: StyleProp<ViewStyle>;
  disableScroll?: boolean;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  keyboardBlurBehavior?: "restore" | "none";
  isOpen?: boolean;
};
