import { StyleProp, ViewStyle } from "react-native";

export type ProfileCardProps = {
  name: string;
  username: string;
  image: string;
  onAddPress: () => void;
  gender: string;
  overrideStyle?: StyleProp<ViewStyle>;
  rightIcon?: React.ReactNode;
};
