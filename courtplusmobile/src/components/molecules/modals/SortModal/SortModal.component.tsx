import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RadioButton, ButtonsRow, BottomSheetOverlay } from "molecules/index";
import React, { forwardRef, useMemo } from "react";
import { View } from "react-native";
import styles from "./SortModal.styles";
import { SortModalProps } from "./SortModal.types";
import { useTranslation } from "react-i18next";
import { useSortModal } from "./SortModal.logic";
import { useThemeContext } from "contexts";

const SortModal = forwardRef<BottomSheetModal, SortModalProps>(
  ({ onClear, onSelectSort, sortItem }, ref) => {
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);
    const {
      sortItems,
      isButtonDisabled,
      handleSelectSort,
      handleClear,
      handleDone,
      selectedSort,
    } = useSortModal({
      sortItem,
      onClear,
      onSelectSort,
    });

    return (
      <BottomSheetOverlay isWhite ref={ref} title={t("filters.sort")}>
        <View style={themedStyles.content}>
          {sortItems.map((sort, index) => (
            <RadioButton
              key={sort.key}
              isDark
              title={sort.title}
              isSelected={sort.key === selectedSort?.key}
              onPress={() => handleSelectSort(sort)}
              overrideStyle={[
                themedStyles.radioButton,
                index < sortItems.length - 1 && themedStyles.radioDivider,
              ]}
            />
          ))}
        </View>
        <ButtonsRow
          secondaryButtonDisabled={isButtonDisabled}
          overrideStyle={themedStyles.buttons}
          onPress={handleClear}
          onSecondaryPress={handleDone}
          title={t("general.clear")}
          secondaryTitle={t("general.done")}
        />
      </BottomSheetOverlay>
    );
  }
);

export default SortModal;
