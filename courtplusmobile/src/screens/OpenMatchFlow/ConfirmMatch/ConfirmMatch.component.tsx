import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { Header, LabelValuePair, PaymentOptionItem } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { useConfirmMatch } from "./ConfirmMatch.logic";
import { Images } from "theme";
import { useThemeContext } from "contexts";
import { enterRise } from "utils";
import styles from "./ConfirmMatch.styles";

const ConfirmMatchScreen = () => {
  const { t } = useTranslation();
  const {
    game,
    totalAmountSplitted,
    level,
    duration,
    court,
    formattedDate,
    onCreateBooking,
  } = useConfirmMatch();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <MainWrapper>
      <Header whiteColor title={t("openMatch.newMatch")} />
      <View style={themedStyles.content}>
        <Animated.View entering={enterRise(0)}>
          <Card overrideStyle={themedStyles.card}>
            <View style={themedStyles.courtContainer}>
              <CustomText
                text={court?.name ?? ""}
                font="cardTitle"
                weight="bold"
                numberOfLines={2}
                overrideStyle={themedStyles.courtName}
              />
              <Chip
                title={game.label}
                isSelected={false}
                variant="feature"
                size="small"
                leftComponent={
                  <Image
                    source={Images[game.icon]}
                    style={themedStyles.gameIcon}
                  />
                }
              />
            </View>
            <View style={themedStyles.locationContainer}>
              <Image
                source={Images.location}
                style={themedStyles.locationIcon}
              />
              <CustomText
                text={
                  court?.branch?.location?.name ??
                  court?.location?.name ??
                  court?.branch?.name ??
                  ""
                }
                font="caption"
                weight="regular"
                numberOfLines={1}
                overrideStyle={themedStyles.locationText}
              />
            </View>
            <View style={themedStyles.divider} />
            <View style={themedStyles.dateContainer}>
              <View style={themedStyles.dateIconTile}>
                <Image source={Images.calendar} style={themedStyles.dateIcon} />
              </View>
              <CustomText
                text={formattedDate}
                font="headline3"
                weight="semiBold"
                numberOfLines={2}
                overrideStyle={themedStyles.dateText}
              />
              <View style={themedStyles.durationContainer}>
                <Image
                  source={Images.timeCircle}
                  style={themedStyles.durationIcon}
                />
                <LabelValuePair
                  label={`${duration}`}
                  value={t("general.mins")}
                />
              </View>
            </View>
            <View style={themedStyles.levelContainer}>
              <Chip
                title={level.title}
                isSelected={false}
                size="small"
                leftComponent={
                  <Image
                    source={Images.paddle}
                    style={themedStyles.levelIcon}
                  />
                }
              />
            </View>
          </Card>
        </Animated.View>
        <Animated.View entering={enterRise(1)}>
          <PaymentOptionItem
            title={t("booking.payPart")}
            isSelected
            disabled
            amount={totalAmountSplitted}
            onPress={() => {}}
            overrideStyle={themedStyles.paymentOptionItem}
          />
        </Animated.View>
      </View>
      <Animated.View
        entering={enterRise(2)}
        style={themedStyles.bottomContainer}
      >
        <CustomButton
          title={t("openMatch.continueToPayment")}
          variant="primary"
          onPress={onCreateBooking}
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default ConfirmMatchScreen;
