import { Header } from "molecules/index";
import { MainWrapper, TimeSlots } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePickTime } from "./PickTime.logic";
import styles from "./PickTime.styles";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomButton } from "atoms/index";
import { useThemeContext } from "contexts";
import { enterRise, verticalScale } from "utils";

const PickTimeScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { bottom } = useSafeAreaInsets();
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
    <View style={themedStyles.container}>
      <MainWrapper
        scrollEnabled
        disableBottomPadding
        overrideContentStyle={themedStyles.scrollViewContent}
      >
        <Header whiteColor title={t("openMatch.pickTime")} />
        <Animated.View entering={enterRise(0)} style={themedStyles.slotsCard}>
          <TimeSlots
            slots={timeSlots}
            isLoading={isLoading}
            onTimeSlotPress={onTimeSlotPress}
            selectedSlots={selectedSlots ?? []}
          />
        </Animated.View>
      </MainWrapper>
      <View
        style={[
          themedStyles.bottomContainer,
          { paddingBottom: bottom + verticalScale(14) },
        ]}
      >
        <CustomButton
          variant={isDisabled ? "disabledDark" : "primary"}
          title={t("general.confirm")}
          onPress={onConfirmPress}
          disabled={isDisabled}
        />
      </View>
    </View>
  );
};

export default PickTimeScreen;
