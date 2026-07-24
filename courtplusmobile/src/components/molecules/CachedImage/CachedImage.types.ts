import { StyleProp } from "react-native";
import { ImageStyle } from "react-native-fast-image";

export type CachedImageProps = {
  source: string;
  overrideStyle?: StyleProp<ImageStyle>;
  children?: React.ReactNode;
};
