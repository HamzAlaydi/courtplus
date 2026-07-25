import { StyleProp, ViewStyle } from "react-native";

export type CarouselMedia = {
  url: string;
  isVideo?: boolean;
};

export type CarouselProps = {
  images: CarouselMedia[];
  overrideStyle?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onImagePress?: (index: number) => void;
  showPagination?: boolean;
};
