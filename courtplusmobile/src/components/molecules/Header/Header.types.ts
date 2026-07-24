import { StyleProp, TextStyle, ViewStyle } from "react-native";

export type HeaderProps = {
  leadingComponent?: React.ReactNode;
  trailingComponent?: React.ReactNode;
  leadingComponentStyle?: StyleProp<ViewStyle>;
  trailingComponentStyle?: StyleProp<ViewStyle>;
  overrideBackButtonStyle?: StyleProp<ViewStyle>;
  overrideTitleStyle?: StyleProp<TextStyle>;
  whiteColor?: boolean;
  title?: string;
  showBackButton?: boolean;
  overrideTitleContainerStyle?: StyleProp<ViewStyle>;
  overrideStyle?: StyleProp<ViewStyle>;
};
