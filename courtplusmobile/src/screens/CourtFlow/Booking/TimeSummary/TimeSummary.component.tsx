import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { BookingButtons, Header, Stepper, StepperFlow } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, ImageSourcePropType, View } from "react-native";
import Animated from "react-native-reanimated";
import styles from "./TimeSummary.styles";
import { Images } from "theme";
import { CourtStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useTimeSummary } from "./TimeSummary.logic";
import { enterRise, getCourtImage } from "utils";

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

  const details: {
    key: string;
    icon: ImageSourcePropType;
    label: string;
    value: string;
  }[] = [
    {
      key: "date",
      icon: Images.calendar,
      label: t("general.date"),
      value: formattedDate,
    },
    {
      key: "time",
      icon: Images.timeCircle,
      label: t("general.time"),
      value: formattedTime,
    },
  ];

  return (
    <View style={themedStyles.layout}>
      <MainWrapper
        scrollEnabled
        overrideContentStyle={themedStyles.scrollContent}
      >
        <Header whiteColor title={t("booking.title")} />
        <View style={themedStyles.content}>
          <Stepper flow={StepperFlow.Booking} currentStep={2} />
          <CustomText
            text={t("booking.timeSummary")}
            font="sectionTitle"
            weight="bold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />

          <Animated.View entering={enterRise(0)} style={themedStyles.ticket}>
            <Image
              source={courtData ? getCourtImage(courtData) : Images.openMatch}
              style={themedStyles.courtImage}
            />
            <View style={themedStyles.infoContainer}>
              <CustomText
                text={courtData?.name ?? ""}
                font="cardTitle"
                weight="bold"
                numberOfLines={2}
                overrideStyle={themedStyles.courtName}
              />
              {!!courtData?.branch?.name && (
                <View style={themedStyles.branchContainer}>
                  <Image
                    source={Images.location}
                    style={themedStyles.branchIcon}
                  />
                  <CustomText
                    text={courtData.branch.name}
                    overrideStyle={themedStyles.branchName}
                    font="caption"
                    weight="regular"
                    numberOfLines={1}
                  />
                </View>
              )}
            </View>

            <View style={themedStyles.perforation}>
              <View style={themedStyles.perforationLine} />
              <View style={[themedStyles.notch, themedStyles.notchStart]} />
              <View style={[themedStyles.notch, themedStyles.notchEnd]} />
            </View>

            <View style={themedStyles.detailsContainer}>
              {details.map((detail, index) => (
                <Animated.View
                  key={detail.key}
                  entering={enterRise(index + 1)}
                  style={themedStyles.detailRow}
                >
                  <View style={themedStyles.iconTile}>
                    <Image source={detail.icon} style={themedStyles.icon} />
                  </View>
                  <View style={themedStyles.detailText}>
                    <CustomText
                      text={detail.label}
                      font="caption"
                      weight="medium"
                      overrideStyle={themedStyles.label}
                    />
                    <CustomText
                      font="displayNumber"
                      weight="bold"
                      text={detail.value}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                      overrideStyle={themedStyles.value}
                    />
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <View style={themedStyles.noteContainer}>
            <Image source={Images.timezone} style={themedStyles.noteIcon} />
            <CustomText
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.description}
              text={t("booking.courtTime")}
            />
          </View>
        </View>
      </MainWrapper>

      <BookingButtons onCancelPress={() => {}} onNextPress={onNextPress} />
    </View>
  );
};

export default TimeSummaryScreen;
