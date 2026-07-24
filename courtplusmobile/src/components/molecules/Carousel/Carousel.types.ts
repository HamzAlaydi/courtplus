import { StyleProp, ViewStyle } from "react-native";

export type CarouselProps = {
  images: string[];
  overrideStyle?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onImagePress?: (index: number) => void;
  showPagination?: boolean;
};
