import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomButton } from "atoms/index";
import { BottomSheetOverlay } from "molecules/index";
import { RadioButton } from "molecules/index";
import React, { forwardRef, useMemo, useState } from "react";
import { View } from "react-native";
import styles from "./GenderModal.styles";
import { GenderModalProps } from "./GenderModal.types";
import { useTranslation } from "react-i18next";
import { mapGenderValue } from "utils";
import { useThemeContext } from "contexts";

const GenderModal = forwardRef<BottomSheetModal, GenderModalProps>(
  (
    {
      onSelectGender,
      isWhite = false,
      selectedGender = "",
      includeMixed = false,
    },
    ref
  ) => {
    const [gender, setGender] = useState<string>(() =>
      selectedGender ? mapGenderValue(selectedGender)?.value || "" : ""
    );
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(
      () => styles(colors, isWhite),
      [colors, isWhite]
    );

    const handleSelectGender = (gender: string) => {
      setGender(gender);
    };

    const handleSave = () => {
      onSelectGender(gender);
    };

    return (
      <BottomSheetOverlay
        isWhite={isWhite}
        ref={ref}
        title={t("general.gender")}
      >
        <View style={themedStyles.content}>
          <RadioButton
            title={t("general.male")}
            isSelected={gender === "male"}
            onPress={() => handleSelectGender("male")}
            isDark={isWhite}
            overrideStyle={[themedStyles.option, themedStyles.optionDivider]}
          />
          <RadioButton
            title={t("general.female")}
            isSelected={gender === "female"}
            onPress={() => handleSelectGender("female")}
            isDark={isWhite}
            overrideStyle={[
              themedStyles.option,
              includeMixed && themedStyles.optionDivider,
            ]}
          />
          {includeMixed && (
            <RadioButton
              title={t("openMatch.mixedGender")}
              isSelected={gender === "other"}
              onPress={() => handleSelectGender("other")}
              isDark={isWhite}
              overrideStyle={themedStyles.option}
            />
          )}
        </View>
        <CustomButton
          title={t("general.save")}
          onPress={handleSave}
          variant={!gender ? "bordered" : "primary"}
          overrideStyle={themedStyles.button}
          disabled={!gender}
        />
      </BottomSheetOverlay>
    );
  }
);

export default GenderModal;
