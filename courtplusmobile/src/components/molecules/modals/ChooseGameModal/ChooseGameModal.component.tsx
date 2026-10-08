import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import RadioButton from "molecules/RadioButton/RadioButton.component";
import React, { forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import styles from "./ChooseGame.styles";
import { ChooseGameModalProps } from "./ChooseGameModal.types";
import { useChooseGameModal } from "./ChooseGameModal.logic";

const ChooseGameModal = forwardRef<BottomSheetModal, ChooseGameModalProps>(
  ({ onGameSelect, selectedGame, isOpen }, ref) => {
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();

    const themedStyles = useMemo(() => styles(colors), [colors]);
    const {
      items,
      onGameItemSelect,
      selectedGameItem,
      onNextPress,
      isNextButtonDisabled,
      onDismiss,
    } = useChooseGameModal({
      selectedGame,
      onGameSelect,
    });

    return (
      <BottomSheetOverlay
        onDismiss={onDismiss}
        isOpen={isOpen}
        isWhite
        ref={ref}
        title={t("profile.chooseGame")}
      >
        <View>
          <CustomText
            text={t("profile.chooseGameDescription")}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
          />
          <View style={themedStyles.itemsContainer}>
            {items.map((item, index) => (
              <RadioButton
                isSelected={item.key === selectedGameItem?.key}
                onPress={() => onGameItemSelect(item)}
                key={item.key}
                isDark
                title={item.title}
                overrideStyle={[
                  themedStyles.item,
                  index < items.length - 1 && themedStyles.itemDivider,
                ]}
              />
            ))}
          </View>
          <CustomButton
            title={t("general.next")}
            onPress={onNextPress}
            disabled={isNextButtonDisabled}
            variant={isNextButtonDisabled ? "disabledDark" : "primary"}
            overrideStyle={themedStyles.button}
          />
        </View>
      </BottomSheetOverlay>
    );
  }
);

export default ChooseGameModal;
