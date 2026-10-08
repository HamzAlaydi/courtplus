import { Chip, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterRise, mapSportGame } from "utils";
import styles from "./BookingTicket.styles";
import { useBookingTicket } from "./BookingTicket.logic";

const BookingTicketScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { item, list, statusPill } = useBookingTicket();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const sport = item.court.sport ? mapSportGame(item.court.sport) : undefined;
  const isOddCount = list.length % 2 === 1;

  return (
    <MainWrapper
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header whiteColor title={t("activity.bookingTicket")} />
      <Animated.View entering={enterRise(0)} style={themedStyles.pass}>
        <View style={themedStyles.passTop}>
          <View style={themedStyles.passTopRow}>
            <View style={themedStyles.sportTile}>
              <Image
                source={Images[sport?.icon ?? "paddle"]}
                style={themedStyles.sportIcon}
              />
            </View>
            {!!statusPill && (
              <Chip
                title={statusPill.title}
                isSelected={false}
                variant={statusPill.variant}
                size="small"
              />
            )}
          </View>
          <CustomText
            font="screenTitle"
            weight="extraBold"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            text={sport?.name ?? item.court.sport}
            overrideStyle={themedStyles.sportName}
          />
          <View style={themedStyles.bookingIdContainer}>
            <CustomText
              font="overline"
              weight="semiBold"
              text={t("activity.bookingID")}
              overrideStyle={themedStyles.bookingIdLabel}
            />
            <CustomText
              font="headline3"
              weight="semiBold"
              selectable
              text={`# ${item.id}`}
              overrideStyle={themedStyles.bookingId}
            />
          </View>
        </View>

        <View style={themedStyles.perforation}>
          <View style={[themedStyles.notch, themedStyles.notchStart]} />
          <View style={themedStyles.dashedLine} />
          <View style={[themedStyles.notch, themedStyles.notchEnd]} />
        </View>

        <View style={themedStyles.listContainer}>
          {list.map((listItem, index) => {
            const isFullWidth = isOddCount && index === list.length - 1;
            return (
              <View
                key={`${listItem.title}-${index}`}
                style={[
                  themedStyles.listItemContainer,
                  isFullWidth && themedStyles.listItemFullWidth,
                ]}
              >
                <CustomText
                  font="overline"
                  weight="semiBold"
                  text={listItem.title}
                  overrideStyle={themedStyles.listItem}
                />
                <CustomText
                  font="cardTitle"
                  weight="semiBold"
                  text={listItem.value ?? ""}
                  numberOfLines={isFullWidth ? 2 : 1}
                  adjustsFontSizeToFit={!isFullWidth}
                  minimumFontScale={0.75}
                  selectable={isFullWidth}
                  overrideStyle={themedStyles.listValue}
                />
              </View>
            );
          })}
        </View>
      </Animated.View>
    </MainWrapper>
  );
};

export default BookingTicketScreen;
