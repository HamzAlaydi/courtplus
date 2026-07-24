import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { BottomSheetOverlay } from "molecules/index";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./ReportSubmittedModal.styles";

const ReportSubmittedModal = forwardRef<BottomSheetModal, {}>(({}, ref) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <BottomSheetOverlay isWhite ref={ref}>
      <View style={themedStyles.container}>
        <Image source={Images.success} style={themedStyles.icon} />
        <CustomText
          font="headline1"
          weight="bold"
          text={t("reportSubmitted.title")}
          overrideStyle={themedStyles.title}
        />
        <CustomText
          font="chip"
          weight="regular"
          text={t("reportSubmitted.description")}
          overrideStyle={themedStyles.description}
        />
      </View>
    </BottomSheetOverlay>
  );
});

export default ReportSubmittedModal;
