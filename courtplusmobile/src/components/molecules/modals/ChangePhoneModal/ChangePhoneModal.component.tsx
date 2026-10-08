import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import styles from "./ChangePhoneModal.styles";
import { Images } from "theme";
import { maskPhoneNumber } from "utils";
import { ChangePhoneModalProps } from "./ChangePhoneModal.types";

const ChangePhoneModal = forwardRef<BottomSheetModal, ChangePhoneModalProps>(
  ({ phone, onCancel, onChangePhone, overrideStyle }, ref) => {
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);
    return (
      <BottomSheetOverlay
        isWhite
        ref={ref}
        overrideContentStyle={[themedStyles.container, overrideStyle]}
      >
        <View style={themedStyles.centeredContainer}>
          <View style={themedStyles.iconBadge}>
            <Image source={Images.phone} style={themedStyles.image} />
          </View>
          <CustomText
            font="bottomSheetTitle"
            weight="bold"
            accessibilityRole="header"
            text={`${t("changePhone.yourPhoneNumber")} ${maskPhoneNumber(
              phone
            )}`}
            overrideStyle={themedStyles.title}
          />
          <CustomText
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
            text={t("changePhone.description")}
          />
        </View>
        <View style={themedStyles.actions}>
          <CustomButton
            variant="primary"
            title={t("changePhone.changePhoneNumber")}
            onPress={onChangePhone}
          />
          <CustomButton
            variant="outline"
            title={t("general.cancel")}
            onPress={onCancel}
          />
        </View>
      </BottomSheetOverlay>
    );
  }
);

export default ChangePhoneModal;
