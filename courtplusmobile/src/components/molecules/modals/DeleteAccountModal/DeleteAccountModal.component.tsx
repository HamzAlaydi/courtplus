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
        <View style={themedStyles.iconBadge}>
          <Image source={Images.user} style={themedStyles.image} />
        </View>
        <CustomText
          font="bottomSheetTitle"
          weight="bold"
          accessibilityRole="header"
          text={t("settings.deleteAccountTitle")}
          overrideStyle={themedStyles.title}
        />
        <CustomText
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
          text={t("settings.deleteAccountDescription")}
        />
      </View>
      <View style={themedStyles.actions}>
        <CustomButton
          variant="danger"
          title={t("settings.deleteAccount")}
          onPress={onDeleteAccount}
        />
        <CustomButton
          variant="outline"
          title={t("general.cancel")}
          onPress={onCancel}
        />
      </View>
    </BottomSheetOverlay>
  );
});

export default DeleteAccountModal;
