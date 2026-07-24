import { StyleProp, TextProps, TextStyle } from "react-native";
import { Typography } from "theme";

export type TypographyKeys = keyof typeof Typography;
export type WeightOf<K extends TypographyKeys> = keyof (typeof Typography)[K];

export type CustomTextProps<K extends TypographyKeys> = {
  text: string;
  overrideStyle?: StyleProp<TextStyle>;
  font?: K;
  weight?: WeightOf<K>;
} & Omit<TextProps, "style">;
