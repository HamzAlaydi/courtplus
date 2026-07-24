import { StyleProp, ViewStyle } from "react-native";

export type ChangePhoneModalProps = {
  phone: string;
  onCancel: () => void;
  onChangePhone: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
};
