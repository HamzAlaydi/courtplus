import { TextStyle } from "react-native";
import { isArabic, isRTL, moderateScale, verticalScale } from "utils";
import {
  DisplayFontWeight,
  Fonts,
  FontSizesType,
  TextFontWeight,
} from "./types";

const fonts: Fonts = {
  inter: {
    black: "Inter-Black",
    bold: "Inter-Bold",
    extraLight: "Inter-ExtraLight",
    light: "Inter-Light",
    regular: "Inter-Regular",
    semiBold: "Inter-SemiBold",
    medium: "Inter-Medium",
  },
  cairo: {
    black: "Cairo-Black",
    bold: "Cairo-Bold",
    extraLight: "Cairo-ExtraLight",
    light: "Cairo-Light",
    regular: "Cairo-Regular",
    semiBold: "Cairo-SemiBold",
    medium: "Cairo-Medium",
  },
  readexPro: {
    regular: "ReadexPro-Regular",
    medium: "ReadexPro-Medium",
    semiBold: "ReadexPro-SemiBold",
    bold: "ReadexPro-Bold",
  },
  unbounded: {
    semiBold: "Unbounded-SemiBold",
    bold: "Unbounded-Bold",
    extraBold: "Unbounded-ExtraBold",
  },
  alexandria: {
    semiBold: "Alexandria-SemiBold",
    bold: "Alexandria-Bold",
    extraBold: "Alexandria-ExtraBold",
  },
};

const fontSizes: FontSizesType = {
  2: moderateScale(2),
  4: moderateScale(4),
  6: moderateScale(6),
  8: moderateScale(8),
  10: moderateScale(10),
  12: moderateScale(12),
  13: moderateScale(13),
  14: moderateScale(14),
  16: moderateScale(16),
  18: moderateScale(18),
  20: moderateScale(20),
  22: moderateScale(22),
  24: moderateScale(24),
  26: moderateScale(26),
  28: moderateScale(28),
  30: moderateScale(30),
  32: moderateScale(32),
};

/** Text face for every script: Readex Pro. */
export const getFontType = (type: TextFontWeight) => fonts.readexPro[type];

const ARABIC_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Whether a value is text containing Arabic-script characters. Any React child
 * is accepted: numbers, nullish values and elements count as non-Arabic.
 */
export const hasArabicScript = (value: unknown): boolean => {
  if (typeof value === "string") {
    return ARABIC_SCRIPT.test(value);
  }
  if (Array.isArray(value)) {
    return value.some(hasArabicScript);
  }
  return false;
};

/**
 * Display face, chosen by script: Alexandria for Arabic (the Arabic UI, or
 * Arabic text such as a user or court name in the English UI), Unbounded
 * otherwise. Unbounded has no Arabic glyphs.
 */
export const getDisplayFont = (type: DisplayFontWeight, text?: unknown) =>
  isArabic || hasArabicScript(text)
    ? fonts.alexandria[type]
    : fonts.unbounded[type];

const ARABIC_DISPLAY_FONTS: Record<string, string> = {
  [fonts.unbounded.semiBold]: fonts.alexandria.semiBold,
  [fonts.unbounded.bold]: fonts.alexandria.bold,
  [fonts.unbounded.extraBold]: fonts.alexandria.extraBold,
};

/** Line height to font size ratio that keeps Arabic marks from clipping. */
const ARABIC_LINE_RATIO = 1.45;

/**
 * Overrides for Arabic-script text rendered with a resolved (flattened) text
 * style. An Unbounded face is swapped for the matching Alexandria weight with
 * room for Arabic marks, and letter spacing is removed because it breaks the
 * joins between letters. Returns undefined when nothing needs to change.
 */
export const getArabicScriptStyle = (
  style: TextStyle
): TextStyle | undefined => {
  const family = style.fontFamily
    ? ARABIC_DISPLAY_FONTS[style.fontFamily]
    : undefined;
  if (!family && !style.letterSpacing) {
    return undefined;
  }
  const result: TextStyle = { letterSpacing: 0 };
  if (family) {
    result.fontFamily = family;
    if (style.fontSize && style.lineHeight) {
      const minLineHeight = Math.round(style.fontSize * ARABIC_LINE_RATIO);
      if (style.lineHeight < minLineHeight) {
        result.lineHeight = minLineHeight;
      }
    }
  }
  return result;
};

/**
 * Letter spacing for display text, given in em. Arabic is never letter-spaced
 * because it breaks the joins between letters.
 */
const tracking = (size: number, em: number) => (isArabic ? 0 : size * em);

const displaySize = (en: number, ar: number) =>
  moderateScale(isArabic ? ar : en);

const Typography = {
  display: {
    bold: {
      fontSize: fontSizes[28],
      fontFamily: getDisplayFont("extraBold"),
      lineHeight: moderateScale(isArabic ? 42 : 35),
      letterSpacing: tracking(fontSizes[28], 0.01),
    },
  },
  displayHero: {
    extraBold: {
      fontSize: displaySize(26, 28),
      fontFamily: getDisplayFont("extraBold"),
      lineHeight: moderateScale(isArabic ? 38 : 31),
      letterSpacing: tracking(displaySize(26, 28), 0.01),
    },
    bold: {
      fontSize: displaySize(26, 28),
      fontFamily: getDisplayFont("bold"),
      lineHeight: moderateScale(isArabic ? 38 : 31),
      letterSpacing: tracking(displaySize(26, 28), 0.01),
    },
  },
  screenTitle: {
    extraBold: {
      fontSize: displaySize(19, 22),
      fontFamily: getDisplayFont("extraBold"),
      lineHeight: moderateScale(isArabic ? 32 : 25),
      letterSpacing: tracking(displaySize(19, 22), 0.01),
    },
    bold: {
      fontSize: displaySize(19, 22),
      fontFamily: getDisplayFont("bold"),
      lineHeight: moderateScale(isArabic ? 32 : 25),
      letterSpacing: tracking(displaySize(19, 22), 0.01),
    },
  },
  sectionTitle: {
    bold: {
      fontSize: displaySize(14, 16),
      fontFamily: getDisplayFont(isArabic ? "extraBold" : "bold"),
      lineHeight: moderateScale(isArabic ? 24 : 19),
      letterSpacing: tracking(displaySize(14, 16), 0.02),
    },
    small: {
      fontSize: displaySize(12, 15),
      fontFamily: getDisplayFont("bold"),
      lineHeight: moderateScale(isArabic ? 22 : 17),
      letterSpacing: tracking(displaySize(12, 15), 0.06),
    },
  },
  displayNumber: {
    bold: {
      fontSize: moderateScale(18),
      fontFamily: getDisplayFont("bold"),
      lineHeight: moderateScale(isArabic ? 28 : 24),
    },
    extraBold: {
      fontSize: moderateScale(20),
      fontFamily: getDisplayFont("extraBold"),
      lineHeight: moderateScale(isArabic ? 30 : 26),
    },
    large: {
      fontSize: moderateScale(28),
      fontFamily: getDisplayFont("extraBold"),
      lineHeight: moderateScale(isArabic ? 40 : 34),
    },
  },
  displayButton: {
    bold: {
      fontSize: displaySize(13, 16),
      fontFamily: getDisplayFont(isArabic ? "extraBold" : "bold"),
      lineHeight: moderateScale(isArabic ? 24 : 18),
      letterSpacing: tracking(displaySize(13, 16), 0.04),
    },
    large: {
      fontSize: displaySize(14, 16),
      fontFamily: getDisplayFont(isArabic ? "extraBold" : "bold"),
      lineHeight: moderateScale(isArabic ? 24 : 19),
      letterSpacing: tracking(displaySize(14, 16), 0.03),
    },
  },
  dayNumber: {
    bold: {
      fontSize: moderateScale(17),
      fontFamily: getDisplayFont("bold"),
      lineHeight: moderateScale(isArabic ? 26 : 22),
    },
  },
  cardTitle: {
    semiBold: {
      fontSize: moderateScale(15),
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(21),
    },
    bold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(22),
    },
  },
  caption: {
    regular: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(17),
    },
    medium: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(17),
    },
    semiBold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(17),
    },
  },
  tabLabel: {
    medium: {
      fontSize: moderateScale(11),
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(14),
    },
    semiBold: {
      fontSize: moderateScale(11),
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(14),
    },
  },
  overline: {
    semiBold: {
      fontSize: fontSizes[10],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(14),
      letterSpacing: tracking(fontSizes[10], 0.06),
    },
  },
  headline1: {
    semiBold: {
      fontSize: fontSizes[26],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(39),
    },
    bold: {
      fontSize: fontSizes[26],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(39),
    },
  },
  headline2: {
    semiBold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(24),
    },
    bold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(24),
    },
  },
  headline3: {
    semiBold: {
      fontSize: fontSizes[14],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(21),
    },
    regular: {
      fontSize: fontSizes[14],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(21),
    },
    bold: {
      fontSize: fontSizes[14],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(21),
    },
    medium: {
      fontSize: fontSizes[14],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(21),
    },
  },
  body: {
    medium: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("medium"),
      lineHeight: verticalScale(24),
    },
    regular: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("medium"),
      lineHeight: verticalScale(18),
    },
    semiBold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("semiBold"),
      lineHeight: verticalScale(18),
    },
  },
  fields: {
    medium: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("medium"),
      lineHeight: verticalScale(24),
    },
    regular: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(24),
    },
    semiBold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(24),
    },
    bold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(24),
    },
  },
  buttons: {
    semiBold: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(24),
    },
    medium: {
      fontSize: fontSizes[16],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(24),
    },
  },
  title: {
    semiBold: {
      fontSize: fontSizes[20],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(30),
    },
    bold: {
      fontSize: fontSizes[20],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(30),
    },
  },
  text: {
    regular: {
      fontSize: fontSizes[10],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(15),
    },
    medium: {
      fontSize: fontSizes[10],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(15),
    },
    bold: {
      fontSize: fontSizes[10],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(15),
    },
    semiBold: {
      fontSize: fontSizes[10],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(15),
    },
  },
  chip: {
    regular: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(18),
    },
    medium: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(18),
    },
    bold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(18),
    },
    semiBold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(18),
    },
  },
  bottomSheetTitle: {
    bold: {
      fontSize: fontSizes[18],
      fontFamily: getFontType("bold"),
      lineHeight: !isRTL ? moderateScale(24) : moderateScale(28),
    },
    regular: {
      fontSize: fontSizes[18],
      fontFamily: getFontType("regular"),
      lineHeight: !isRTL ? moderateScale(24) : moderateScale(28),
    },
  },
  description: {
    regular: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("regular"),
      lineHeight: moderateScale(18),
    },
    medium: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("medium"),
      lineHeight: moderateScale(18),
    },
    bold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(18),
    },
    semiBold: {
      fontSize: fontSizes[12],
      fontFamily: getFontType("semiBold"),
      lineHeight: moderateScale(18),
    },
  },
};

/**
 * Display variants whose English text is set in capitals. Arabic has no
 * letter case, so these are never transformed for Arabic.
 */
const UPPERCASE_VARIANTS: ReadonlyArray<keyof typeof Typography> = [
  "displayHero",
  "screenTitle",
  "sectionTitle",
  "displayButton",
  "overline",
];

export { Typography, fontSizes, fonts, UPPERCASE_VARIANTS };
