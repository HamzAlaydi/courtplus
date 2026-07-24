import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import styles from "./ReportHeader.styles";
import { Image, TouchableOpacity, View } from "react-native";
import { ReportHeaderProps } from "./ReportHeader.types";
import { CustomText } from "atoms/index";
import { Images } from "theme";
import { useBottomSheet } from "@gorhom/bottom-sheet";

const ReportHeader = ({ title, showBack, onBack }: ReportHeaderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { close } = useBottomSheet();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={themedStyles.header}>
      {showBack && (
        <View style={themedStyles.headerLeft}>
          <TouchableOpacity onPress={onBack}>
            <Image source={Images.arrowLeft} style={themedStyles.arrowIcon} />
          </TouchableOpacity>
        </View>
      )}

      <CustomText text={title} font="fields" weight="semiBold" />

      <TouchableOpacity
        style={themedStyles.closeButton}
        onPress={() => close()}
      >
        <Image source={Images.close} />
      </TouchableOpacity>
    </View>
  );
};

export default ReportHeader;
