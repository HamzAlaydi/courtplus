import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./LogoutModal.styles";
import { LogoutModalProps } from "./LogoutModal.types";

const LogoutModal = forwardRef<BottomSheetModal, LogoutModalProps>(
  ({ username, onLogout, onCancel }, ref) => {
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
            <Image source={Images.logout} style={themedStyles.image} />
          </View>
          <CustomText
            font="bottomSheetTitle"
            weight="bold"
            accessibilityRole="header"
            text={t("profile.logout", { username })}
            overrideStyle={themedStyles.title}
          />
          <CustomText
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
            text={t("profile.logoutDescription")}
          />
        </View>
        <View style={themedStyles.actions}>
          <CustomButton
            variant="danger"
            title={t("settings.logout")}
            onPress={onLogout}
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

export default LogoutModal;
