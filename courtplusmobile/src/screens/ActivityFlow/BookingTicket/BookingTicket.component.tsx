import { RouteProp, useRoute } from "@react-navigation/native";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header } from "molecules/index";
import { ActivityStackParamList } from "navigation/types";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./BookingTicket.styles";
import { useBookingTicket } from "./BookingTicket.logic";
import { verticalScale } from "utils";

const BookingTicketScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { item, list } = useBookingTicket();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <MainWrapper>
      <Header whiteColor title={t("activity.bookingTicket")} />
      <ImageBackground
        source={Images.ticket}
        style={themedStyles.imageBackground}
      >
        <View style={themedStyles.contentContainer}>
          <CustomText font="title" weight="bold" text={item.court.sport} />
          <CustomText
            font="chip"
            weight="medium"
            text={`${t("activity.bookingID")} # ${item.id}`}
            overrideStyle={themedStyles.bookingId}
          />
        </View>
        <View style={themedStyles.dottedLine} />
        <View style={themedStyles.listContainer}>
          {list.map((item, index) => (
            <View
              key={`${item.title}-${index}`}
              style={[
                themedStyles.listItemContainer,
                {
                  marginBottom:
                    index === list.length - 1 ? 0 : verticalScale(12),
                },
              ]}
            >
              <CustomText
                font="chip"
                weight="medium"
                text={item.title}
                overrideStyle={themedStyles.listItem}
              />
              <CustomText
                font="chip"
                weight="semiBold"
                text={item.value ?? ""}
                numberOfLines={1}
                overrideStyle={themedStyles.listValue}
              />
            </View>
          ))}
        </View>
        <View
          style={[themedStyles.dottedLine, themedStyles.secondDottedLine]}
        />
      </ImageBackground>
    </MainWrapper>
  );
};

export default BookingTicketScreen;
