import { Typography } from "./fonts";

export type ColorsType = {
  GREEN_YELLOWISH: string;
  DARK_GREEN: string;
  WHITE: string;
  GREY: string;
  GREEN: string;
  BLACK: string;
  BACKGROUND: string;
  DARK_RED: string;
  RED: string;
  CYAN: string;
  SUBMARINE: string;
  SLATE_GRAY: string;
  LIGHT_BLUE: string;
  BLUE_LIGHTEST: string;
  GRAYISH_BLUE: string;
  GHOST_WHITE: string;
  MED_GREY: string;
  LIGHT_GREY: string;
  YELLOW: string;
  MED_GREEN: string;
  MED_GREY_2: string;
  MED_GREY_3: string;
  TIMID_CLOUD: string;
  BUTTON_GREEN: string;
  DARK_BLUE: string;
  MED_BLACK: string;
  MED_RED: string;
};

export type ColorSwitcher = {
  colors: ColorsType;
  dark: boolean;
};

export type Colors = {
  light: ColorSwitcher;
  dark: ColorSwitcher;
};

export type FontsType = {
  black: string;
  bold: string;
  extraLight: string;
  light: string;
  regular: string;
  semiBold: string;
  medium: string;
};

export type Fonts = {
  cairo: FontsType;
  inter: FontsType;
};

type UniosKeys<T> = T extends unknown ? keyof T : never;
type TypographySections = (typeof Typography)[keyof typeof Typography];
export type AppFontsProps = keyof typeof Typography;

export type weight = UniosKeys<TypographySections>;

export type FontSizesType = {
  2: number;
  4: number;
  6: number;
  8: number;
  10: number;
  12: number;
  13: number;
  14: number;
  16: number;
  18: number;
  20: number;
  22: number;
  24: number;
  26: number;
  28: number;
  30: number;
  32: number;
};
