import { Header } from "molecules/index";
import { MainWrapper, TimeSlots } from "organisms/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { usePickTime } from "./PickTime.logic";
import styles from "./PickTime.styles";
import { View } from "react-native";
import { CustomButton } from "atoms/index";

const PickTimeScreen = () => {
  const { t } = useTranslation();
  const {
    timeSlots,
    isLoading,
    isDisabled,
    onTimeSlotPress,
    selectedSlots,
    onConfirmPress,
  } = usePickTime();

  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("openMatch.pickTime")} />
      <TimeSlots
        slots={timeSlots}
        isLoading={isLoading}
        onTimeSlotPress={onTimeSlotPress}
        selectedSlots={selectedSlots ?? []}
        overrideStyle={styles.content}
      />
      <View style={styles.bottomContainer}>
        <CustomButton
          variant={isDisabled ? "disabledDark" : "dark"}
          title={t("general.confirm")}
          onPress={onConfirmPress}
          disabled={isDisabled}
        />
      </View>
    </MainWrapper>
  );
};

export default PickTimeScreen;
