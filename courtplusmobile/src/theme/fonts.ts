import { isArabic, isRTL, moderateScale, verticalScale } from "utils";
import { Fonts, FontSizesType } from "./types";

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

export const getFontType = (
  type: "medium" | "semiBold" | "regular" | "bold"
) => {
  switch (type) {
    case "bold":
      return !isArabic ? fonts.inter.bold : fonts.cairo.bold;
    case "medium":
      return !isArabic ? fonts.inter.medium : fonts.cairo.medium;
    case "regular":
      return !isArabic ? fonts.inter.regular : fonts.cairo.regular;
    case "semiBold":
      return !isArabic ? fonts.inter.semiBold : fonts.cairo.semiBold;
  }
};

const Typography = {
  display: {
    bold: {
      fontSize: fontSizes[32],
      fontFamily: getFontType("bold"),
      lineHeight: moderateScale(48),
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
      lineHeight: !isRTL ? moderateScale(18) : moderateScale(24),
    },
    regular: {
      fontSize: fontSizes[18],
      fontFamily: getFontType("regular"),
      lineHeight: !isRTL ? moderateScale(18) : moderateScale(24),
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

export { Typography, fontSizes };
