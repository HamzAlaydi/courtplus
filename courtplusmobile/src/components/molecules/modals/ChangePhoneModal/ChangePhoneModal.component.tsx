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
          <Image source={Images.phone} style={themedStyles.image} />
          <CustomText
            font="headline3"
            weight="bold"
            text={`${t("changePhone.yourPhoneNumber")} ${maskPhoneNumber(
              phone
            )}`}
            overrideStyle={themedStyles.title}
          />
          <CustomText
            font="chip"
            weight="medium"
            overrideStyle={themedStyles.description}
            text={t("changePhone.description")}
          />
        </View>
        <CustomButton
          title={t("changePhone.changePhoneNumber")}
          overrideStyle={themedStyles.changePhoneButton}
          overrideTextStyle={themedStyles.changePhoneButtonText}
          onPress={onChangePhone}
        />
        <CustomButton
          title={t("general.cancel")}
          onPress={onCancel}
          overrideStyle={themedStyles.cancelButton}
          overrideTextStyle={themedStyles.cancelButtonText}
        />
      </BottomSheetOverlay>
    );
  }
);

export default ChangePhoneModal;
