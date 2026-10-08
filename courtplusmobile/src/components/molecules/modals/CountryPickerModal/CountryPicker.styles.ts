import { Style } from "react-native-country-codes-picker";
import { ColorsType, getFontType, Radius } from "theme";
import { isRTL, moderateScale, spacing, verticalScale } from "utils";

export default (colors: ColorsType): Style => ({
  backdrop: {
    backgroundColor: colors.SCRIM,
  },
  modal: {
    maxHeight: verticalScale(600),
    backgroundColor: colors.CARD,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingHorizontal: spacing[16],
    paddingTop: verticalScale(18),
  },
  modalInner: {
    backgroundColor: colors.CARD,
  },
  textInput: {
    height: verticalScale(48),
    paddingHorizontal: spacing[14],
    backgroundColor: colors.SUBTLE,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: colors.LINE,
    color: colors.INK,
    fontFamily: getFontType("medium"),
    fontSize: moderateScale(14),
    textAlign: isRTL ? "right" : "left",
  },
  line: {
    height: 1,
    marginVertical: verticalScale(10),
    backgroundColor: colors.DIVIDER,
  },
  countryButtonStyles: {
    height: verticalScale(52),
    marginVertical: verticalScale(3),
    paddingHorizontal: spacing[16],
    backgroundColor: colors.SUBTLE,
    borderRadius: Radius.input,
  },
  dialCode: {
    color: colors.INK,
    fontFamily: getFontType("semiBold"),
    fontSize: moderateScale(14),
  },
  countryName: {
    color: colors.INK,
    fontFamily: getFontType("medium"),
    fontSize: moderateScale(14),
  },
  searchMessageText: {
    color: colors.MUTED,
    fontFamily: getFontType("medium"),
    fontSize: moderateScale(14),
  },
});
