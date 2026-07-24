import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RadioButton, ButtonsRow, BottomSheetOverlay } from "molecules/index";
import React, { forwardRef } from "react";
import { View } from "react-native";
import styles from "./SortModal.styles";
import { SortModalProps } from "./SortModal.types";
import { useTranslation } from "react-i18next";
import { useSortModal } from "./SortModal.logic";

const SortModal = forwardRef<BottomSheetModal, SortModalProps>(
  ({ onClear, onSelectSort, sortItem }, ref) => {
    const { t } = useTranslation();
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
      <BottomSheetOverlay isWhite ref={ref} title="Sort">
        <View style={styles.content}>
          {sortItems.map((sort) => (
            <RadioButton
              key={sort.key}
              isDark
              title={sort.title}
              isSelected={sort.key === selectedSort?.key}
              onPress={() => handleSelectSort(sort)}
              overrideStyle={styles.radioButton}
            />
          ))}
        </View>
        <ButtonsRow
          secondaryButtonDisabled={isButtonDisabled}
          overrideStyle={styles.buttons}
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
