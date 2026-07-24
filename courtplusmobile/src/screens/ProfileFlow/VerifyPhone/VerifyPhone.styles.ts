import { StyleSheet } from "react-native";
import { ColorsType } from "theme";
import { verticalScale } from "utils";

export default (colors: ColorsType) =>
  StyleSheet.create({
    content: {
      marginTop: verticalScale(35),
    },
    otpView: {
      marginTop: verticalScale(64),
    },
  });
