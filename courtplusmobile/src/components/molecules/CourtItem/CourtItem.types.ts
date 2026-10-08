import { Court } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type CourtItemProps = {
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  item: Court;
  showBottomInfo?: boolean;
  /**
   * Label of the lime call-to-action pill (e.g. t("openMatch.bookNow")).
   * Without it the card shows a round lime arrow button. Both call onPress.
   */
  ctaTitle?: string;
};
