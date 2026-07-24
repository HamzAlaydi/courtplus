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
      <BottomSheetOverlay isWhite ref={ref}>
        <View style={themedStyles.container}>
          <Image source={Images.trash} style={themedStyles.image} />
          <CustomText
            font="headline3"
            weight="bold"
            text={t("profile.deleteGame", { gameName })}
            overrideStyle={themedStyles.title}
          />
        </View>
        <CustomButton
          title={t("general.delete")}
          overrideStyle={themedStyles.deleteButton}
          overrideTextStyle={themedStyles.deleteButtonText}
          onPress={onDeleteGame}
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

export default DeleteGameModal;
