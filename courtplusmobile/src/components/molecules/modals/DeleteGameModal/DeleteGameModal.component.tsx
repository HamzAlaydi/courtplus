import React, { useMemo } from "react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetOverlay } from "molecules/index";
import { forwardRef } from "react";
import { Image, View } from "react-native";
import { CustomButton, CustomText } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./DeleteGameModal.styles";
import { DeleteGameModalProps } from "./DeleteGame.types";

const DeleteGameModal = forwardRef<BottomSheetModal, DeleteGameModalProps>(
  ({ onDeleteGame, onCancel, gameName }, ref) => {
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);

    return (
      <BottomSheetOverlay
        isWhite
        ref={ref}
        overrideContentStyle={themedStyles.sheet}
      >
        <View style={themedStyles.container}>
          <View style={themedStyles.iconBadge}>
            <Image source={Images.trash} style={themedStyles.image} />
          </View>
          <CustomText
            font="bottomSheetTitle"
            weight="bold"
            accessibilityRole="header"
            text={t("profile.deleteGame", { gameName })}
            overrideStyle={themedStyles.title}
          />
        </View>
        <View style={themedStyles.actions}>
          <CustomButton
            variant="danger"
            title={t("general.delete")}
            onPress={onDeleteGame}
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

export default DeleteGameModal;
