import { StyleProp, TextProps, TextStyle } from "react-native";
import { Typography } from "theme";

export type TypographyKeys = keyof typeof Typography;
export type WeightOf<K extends TypographyKeys> = keyof (typeof Typography)[K];

export type CustomTextProps<K extends TypographyKeys> = {
  text: string;
  overrideStyle?: StyleProp<TextStyle>;
  font?: K;
  weight?: WeightOf<K>;
  /**
   * Set English text in capitals. Defaults to true for the display variants
   * (displayHero, screenTitle, sectionTitle, displayButton, overline) and
   * false otherwise. Arabic text is never transformed, in either UI language,
   * and display text containing Arabic script is set in Alexandria.
   */
  uppercase?: boolean;
} & Omit<TextProps, "style">;
