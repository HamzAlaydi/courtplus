import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import styles from "./ReportHeader.styles";
import { Image, View } from "react-native";
import { ReportHeaderProps } from "./ReportHeader.types";
import { CustomText, PressableScale } from "atoms/index";
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
        <PressableScale
          onPress={onBack}
          hitSlop={6}
          accessibilityRole="button"
          style={themedStyles.iconButton}
        >
          <Image source={Images.arrowLeft} style={themedStyles.arrowIcon} />
        </PressableScale>
      )}

      <CustomText
        text={title}
        font="screenTitle"
        weight="extraBold"
        numberOfLines={1}
        accessibilityRole="header"
        overrideStyle={themedStyles.title}
      />

      <PressableScale
        style={themedStyles.iconButton}
        onPress={() => close()}
        hitSlop={6}
        accessibilityRole="button"
      >
        <Image source={Images.close} style={themedStyles.closeIcon} />
      </PressableScale>
    </View>
  );
};

export default ReportHeader;
