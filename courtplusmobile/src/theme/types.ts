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
  /** Primary text, dark header bands, selected chips. */
  INK: string;
  /** Raised surface on ink (fields and buttons on dark screens). */
  DEEP: string;
  /** Primary action fill. Only ever a fill under INK text or icons. */
  LIME: string;
  /** Screen background. */
  GROUND: string;
  /** Card and sheet surface. */
  CARD: string;
  /** 1px borders of fields, chips and outline buttons. */
  LINE: string;
  /** Hairline row separators inside cards. */
  DIVIDER: string;
  /** Secondary text and captions (4.5:1 on white). */
  MUTED: string;
  /** Disabled text and placeholder icons. */
  FAINT: string;
  /** Feature chips (sport, air conditioned, women only). */
  LIME_TINT: string;
  LIME_TINT_TEXT: string;
  LIME_TINT_BORDER: string;
  SUCCESS_BG: string;
  SUCCESS_TEXT: string;
  WARNING_BG: string;
  WARNING_TEXT: string;
  DANGER: string;
  DANGER_BG: string;
  /** Rating star on light surfaces. */
  STAR: string;
  /** Secondary text on INK surfaces. */
  ON_INK_MUTED: string;
  /** Translucent buttons on INK surfaces (bell, location pill). */
  ON_INK_SURFACE: string;
  /** Borders on INK surfaces. */
  ON_INK_LINE: string;
  /** Dark glass badge over photos (rating). */
  GLASS_DARK: string;
  /** Light glass badge over photos (features, bookmark). */
  GLASS_LIGHT: string;
  /** Switch track when off, sheet handle. */
  HANDLE: string;
  /** Grouped rows inside a white sheet. */
  SUBTLE: string;
  /** Backdrop behind sheets and dialogs. */
  SCRIM: string;
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

export type TextFontsType = {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
};

export type DisplayFontsType = {
  semiBold: string;
  bold: string;
  extraBold: string;
};

export type Fonts = {
  cairo: FontsType;
  inter: FontsType;
  readexPro: TextFontsType;
  unbounded: DisplayFontsType;
  alexandria: DisplayFontsType;
};

export type TextFontWeight = keyof TextFontsType;
export type DisplayFontWeight = keyof DisplayFontsType;

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
