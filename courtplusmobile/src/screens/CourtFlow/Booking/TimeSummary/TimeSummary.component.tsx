import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { BookingButtons, Header, Stepper, StepperFlow } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import styles from "./TimeSummary.styles";
import { Images } from "theme";
import { CourtStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useTimeSummary } from "./TimeSummary.logic";

const TimeSummaryScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { navigate } = useNavigation<CourtStackNavigationProp>();
  const { formattedDate, formattedTime, courtData } = useTimeSummary();

  const onNextPress = () => {
    navigate("InviteFriend");
  };
  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("booking.title")} />
      <View style={themedStyles.content}>
        <Stepper flow={StepperFlow.Booking} currentStep={2} />
        <CustomText
          text={t("booking.timeSummary")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.title}
        />

        <Image source={Images.openMatch} style={themedStyles.courtImage} />

        <View style={themedStyles.courtContainer}>
          <View style={themedStyles.infoContainer}>
            <CustomText
              text={courtData?.name ?? ""}
              font="headline2"
              weight="bold"
              overrideStyle={themedStyles.courtName}
            />
            <View style={themedStyles.branchContainer}>
              <Image source={Images.location} />
              <CustomText
                text={courtData?.branch?.name ?? ""}
                overrideStyle={themedStyles.branchName}
                font="chip"
                weight="medium"
              />
            </View>
          </View>
          <View style={themedStyles.dateContainer}>
            <View style={themedStyles.iconContainer}>
              <Image source={Images.calendar} style={themedStyles.icon} />
              <CustomText
                text={t("general.date")}
                font="body"
                weight="medium"
                overrideStyle={themedStyles.dateText}
              />
            </View>

            <CustomText
              font="headline1"
              weight="semiBold"
              text={formattedDate}
              overrideStyle={themedStyles.date}
            />
          </View>
          <View style={themedStyles.timeContainer}>
            <View style={themedStyles.iconContainer}>
              <Image source={Images.timeCircle} style={themedStyles.icon} />
              <CustomText
                text={t("general.time")}
                font="body"
                weight="medium"
                overrideStyle={themedStyles.dateText}
              />
            </View>

            <CustomText
              font="headline1"
              weight="semiBold"
              text={formattedTime}
              overrideStyle={themedStyles.date}
            />
          </View>
        </View>
        <CustomText
          font="text"
          weight="medium"
          overrideStyle={themedStyles.description}
          text={t("booking.courtTime")}
        />
      </View>

      <BookingButtons onCancelPress={() => {}} onNextPress={onNextPress} />
    </MainWrapper>
  );
};

export default TimeSummaryScreen;
