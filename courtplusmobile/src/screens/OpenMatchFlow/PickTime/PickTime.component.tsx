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
    // The slot grid runs to roughly 48 chips across Morning/Day/Evening,
    // which is taller than any phone. MainWrapper is a plain View unless
    // `scrollEnabled` is passed and TimeSlots renders a plain View too, so
    // this screen had NO scrollable container at all: everything past the
    // fold, Confirm included, was unreachable. Same structure as
    // CourtFlow/ChooseTime, which does this correctly.
    <View style={styles.container}>
      <MainWrapper
        scrollEnabled
        whiteBackground
        overrideContentStyle={styles.scrollViewContent}
      >
        <Header whiteColor title={t("openMatch.pickTime")} />
        <TimeSlots
          slots={timeSlots}
          isLoading={isLoading}
          onTimeSlotPress={onTimeSlotPress}
          selectedSlots={selectedSlots ?? []}
          overrideStyle={styles.content}
        />
      </MainWrapper>
      <View style={styles.bottomContainer}>
        <CustomButton
          variant={isDisabled ? "disabledDark" : "dark"}
          title={t("general.confirm")}
          onPress={onConfirmPress}
          disabled={isDisabled}
        />
      </View>
    </View>
  );
};

export default PickTimeScreen;
