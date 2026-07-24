import { CustomText } from "atoms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import { LabelValuePairProps } from "./LabelValuePair.types";
import { useThemeContext } from "contexts";
import styles from "./LabelValuePair.styles";

const LabelValuePair = ({ label, value }: LabelValuePairProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View style={themedStyles.container}>
      <CustomText text={label} font="bottomSheetTitle" weight="regular" />
      <CustomText text={value} font="chip" weight="regular" />
    </View>
  );
};

export default LabelValuePair;
