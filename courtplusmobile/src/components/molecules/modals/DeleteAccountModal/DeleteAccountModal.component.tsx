import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./DeleteAccountModal.styles";
import { DeleteAccountModalProps } from "./DeleteAccountModal.types";

const DeleteAccountModal = forwardRef<
  BottomSheetModal,
  DeleteAccountModalProps
>(({ onDeleteAccount, onCancel }, ref) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <BottomSheetOverlay
      isWhite
      ref={ref}
      overrideContentStyle={themedStyles.container}
    >
      <View style={themedStyles.content}>
        <Image source={Images.user} style={themedStyles.image} />
        <CustomText
          font="bottomSheetTitle"
          weight="bold"
          text={t("settings.deleteAccountTitle")}
          overrideStyle={themedStyles.title}
        />
        <CustomText
          font="description"
          weight="medium"
          overrideStyle={themedStyles.description}
          text={t("settings.deleteAccountDescription")}
        />
      </View>
      <CustomButton
        title={t("settings.deleteAccount")}
        overrideStyle={themedStyles.deleteButton}
        overrideTextStyle={themedStyles.deleteButtonText}
        onPress={onDeleteAccount}
      />
      <CustomButton
        title={t("general.cancel")}
        onPress={onCancel}
        overrideStyle={themedStyles.cancelButton}
        overrideTextStyle={themedStyles.cancelButtonText}
      />
    </BottomSheetOverlay>
  );
});

export default DeleteAccountModal;
