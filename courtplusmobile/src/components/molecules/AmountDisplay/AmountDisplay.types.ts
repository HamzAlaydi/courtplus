import { StyleProp, ViewStyle } from "react-native";

export type AmountDisplayProps = {
  amount: number;
  /** Falls back to the tenant default (SAR) when the court carries none. */
  currency?: string;
  overrideStyle?: StyleProp<ViewStyle>;
};
