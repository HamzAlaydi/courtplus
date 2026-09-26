import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { Header, LabelValuePair, PaymentOptionItem } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { useConfirmMatch } from "./ConfirmMatch.logic";
import { Images } from "theme";
import { useThemeContext } from "contexts";
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
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("openMatch.newMatch")} />
      <View style={themedStyles.content}>
        <Card overrideStyle={themedStyles.card}>
          <View style={themedStyles.courtContainer}>
            <CustomText
              text={court?.name ?? ""}
              font="chip"
              weight="semiBold"
              overrideStyle={themedStyles.courtName}
            />
            <Chip
              title={game.label}
              isSelected
              overrideStyle={themedStyles.chip}
              leftComponent={
                <View style={themedStyles.chipContainer}>
                  <Image
                    source={Images[game.icon]}
                    style={themedStyles.gameIcon}
                  />
                </View>
              }
            />
          </View>
          <View style={themedStyles.dateContainer}>
            <CustomText
              text={formattedDate}
              font="headline2"
              weight="semiBold"
            />
            <View style={themedStyles.dateIconContainer}>
              <Image source={Images.timeCircle} />
              <LabelValuePair label={`${duration}`} value={t("general.mins")} />
            </View>
          </View>
          <View style={themedStyles.locationContainer}>
            <Image source={Images.location} />
            <CustomText
              text={
                court?.branch?.location?.name ??
                court?.location?.name ??
                court?.branch?.name ??
                ""
              }
              font="chip"
              weight="semiBold"
              overrideStyle={themedStyles.locationText}
            />
          </View>
          <View style={themedStyles.levelContainer}>
            <Image source={Images.paddle} style={themedStyles.levelIcon} />
            <View style={themedStyles.levelInnerContainer}>
              <CustomText text={level.title} font="text" weight="medium" />
            </View>
          </View>
        </Card>
        <PaymentOptionItem
          title={t("booking.payPart")}
          isSelected
          disabled
          amount={totalAmountSplitted}
          onPress={() => {}}
          overrideStyle={themedStyles.paymentOptionItem}
        />
      </View>
      <View style={themedStyles.bottomContainer}>
        <CustomButton
          title={t("openMatch.continueToPayment")}
          variant="dark"
          onPress={onCreateBooking}
        />
      </View>
    </MainWrapper>
  );
};

export default ConfirmMatchScreen;
