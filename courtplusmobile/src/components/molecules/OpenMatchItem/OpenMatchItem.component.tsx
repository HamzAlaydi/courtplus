import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./OpenMatchItem.styles";
import { OpenMatchItemProps } from "./OpenMatchItem.types";
import { formatDate } from "date-fns";
import { convertToUTCTime, mapSportItem } from "utils";
import { Sport, User } from "models";
import AmountDisplay from "molecules/AmountDisplay/AmountDisplay.component";
import { AvatarSlots } from "organisms/index";

const OpenMatchItem = ({
  booking,
  overrideStyle,
  onBookNowPress,
  showBookNowButton = true,
}: OpenMatchItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const courtSport: Sport = useMemo(
    () => ({
      id: "",
      name: booking.court.sport || "",
      level: "",
      userId: "",
      timePreference: "",
    }),
    [booking.court.sport]
  );

  const sport = mapSportItem(courtSport);

  return (
    <Card disabled overrideStyle={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.content}>
        <View style={themedStyles.infoHeader}>
          <CustomText
            text={booking.court.name}
            font="chip"
            weight="bold"
            overrideStyle={themedStyles.greyText}
          />
          <Chip
            title={sport.name}
            isSelected={true}
            leftComponent={
              <View style={themedStyles.sportContainer}>
                <Image
                  source={Images[sport.icon]}
                  style={themedStyles.sportIcon}
                />
              </View>
            }
          />
        </View>
        <View style={themedStyles.participantsContainer}>
          <AvatarSlots
            showUsername={false}
            showRemoveButton={false}
            slots={booking.participants.map(
              (participant) => participant.user as User
            )}
          />
        </View>
        <CustomText
          font="headline2"
          weight="semiBold"
          text={formatDate(booking.startDate, "E dd MMM, hh:mm a")}
          overrideStyle={themedStyles.date}
        />
        <View style={themedStyles.locationContainer}>
          <Image source={Images.location} />
          <CustomText
            font="chip"
            weight="medium"
            text={booking.court.branch.location.name}
            overrideStyle={themedStyles.greyText}
          />
        </View>
      </View>
      <View
        style={[
          themedStyles.bottomContainer,
          !showBookNowButton && themedStyles.bottomContainerNoBookNow,
        ]}
      >
        <View style={themedStyles.amountContainer}>
          <AmountDisplay amount={booking.court.hourlyRate} />
          <View style={themedStyles.divider} />
          <View style={themedStyles.timeContainer}>
            <Image source={Images.timeCircle} style={themedStyles.timerIcon} />
            <CustomText text={convertToUTCTime(booking.startDate)} />
          </View>
        </View>
        {showBookNowButton && (
          <CustomButton
            title="Book now"
            variant="dark"
            onPress={onBookNowPress}
            overrideTextStyle={themedStyles.buttonText}
            overrideStyle={themedStyles.button}
          />
        )}
      </View>
    </Card>
  );
};

export default OpenMatchItem;
