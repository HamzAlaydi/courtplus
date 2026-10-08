import React, { forwardRef, useMemo, useState } from "react";
import { LevelSelectionModalProps } from "./LevelSelectionModal.types";
import { View } from "react-native";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { Item, levels } from "utils";
import RadioButton from "molecules/RadioButton/RadioButton.component";
import { useThemeContext } from "contexts";
import styles from "./LevelSelectionModal.styles";
import { useTranslation } from "react-i18next";

const LevelSelectionModal = forwardRef<
  BottomSheetModal,
  LevelSelectionModalProps
>(({ onLevelSelect, selectedLevel, onClose }, ref) => {
  const items = useMemo(() => levels, []);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const selectedLevelItem = useMemo(
    () => items.find((item) => item.key === selectedLevel),
    [selectedLevel]
  );
  const [levelItem, setLevelItem] = useState<Item | undefined>(
    selectedLevelItem
  );

  const isNextButtonDisabled = !levelItem;

  const onLevelItemSelect = () => {
    onLevelSelect(levelItem!!);
    onClose();
  };

  return (
    <BottomSheetOverlay title={t("profile.yourLevel")} isWhite ref={ref}>
      <View>
        <CustomText
          text={t("profile.timePreferenceDesc")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
        />
        <View style={themedStyles.itemsContainer}>
          {items.map((item, index) => (
            <RadioButton
              isSelected={item.key === levelItem?.key}
              onPress={() => setLevelItem(item)}
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
          title={t("general.done")}
          onPress={onLevelItemSelect}
          disabled={isNextButtonDisabled}
          variant={isNextButtonDisabled ? "disabledDark" : "primary"}
          overrideStyle={themedStyles.button}
        />
      </View>
    </BottomSheetOverlay>
  );
});

export default LevelSelectionModal;
