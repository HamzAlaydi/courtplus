import { ImageStyle, StyleProp } from "react-native";

export type StarDisplayProps = {
  rating: number;
  onChange?: (rating: number) => void;
  overrideImageStyle?: StyleProp<ImageStyle>;
};
