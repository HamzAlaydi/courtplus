import { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";

export type BookmarkItemProps = {
  image: ImageSourcePropType;
  title: string;
  locationName: string;
  onPress: () => void;
  overrideStyle?: StyleProp<ViewStyle>;
  onBookmarkPress: () => void;
};
