import { Post } from "models";
import { StyleProp, ViewStyle } from "react-native";

export type PostViewProps = {
  post: Post;
  overrideStyle?: StyleProp<ViewStyle>;
};
