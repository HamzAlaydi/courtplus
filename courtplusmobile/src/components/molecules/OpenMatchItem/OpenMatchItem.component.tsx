import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./OpenMatchItem.styles";
import { OpenMatchItemProps } from "./OpenMatchItem.types";
import { formatDate } from "date-fns";
import { convertToUTCTime, mapSportItem } from "utils";
import { useTranslation } from "react-i18next";
import { Sport, User } from "models";

/** API levels are snake_case ("intermediate_high"); locale keys are camelCase. */
const camelCaseLevel = (level: string) =>
  level.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
import AmountDisplay from "molecules/AmountDisplay/AmountDisplay.component";
import { AvatarSlots } from "organisms/index";

const OpenMatchItem = ({
  booking,
  overrideStyle,
  onBookNowPress,
  showBookNowButton = true,
}: OpenMatchItemProps) => {
  const { t } = useTranslation();
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

  /**
   * What a joiner actually pays, not the court's hourly rate.
   *
   * The card showed `court.hourlyRate`, so a 30-minute 2v2 on a 300/hr court
   * advertised "SAR 300" when the match cost 150 and the joiner's seat was
   * 37.50 — eight times the real price, on the very button they tap to pay.
   */
  const seats = booking.splitSeats ?? (booking.playersASide ?? 1) * 2;
  const sharePerPlayer = useMemo(() => {
    const total = Number(booking.totalAmount);
    if (!Number.isFinite(total) || seats < 1) {
      return 0;
    }
    return Math.round((total / seats + Number.EPSILON) * 100) / 100;
  }, [booking.totalAmount, seats]);

  // Surfaced because the API refuses a join on either of them. Without these
  // the player only discovered the restriction from an error message after
  // tapping Book now.
  const restrictions = [
    booking.level ? t(`general.${camelCaseLevel(booking.level)}`, booking.level) : null,
    booking.gender && booking.gender !== "other"
      ? t(`general.${booking.gender}`, booking.gender)
      : null,
  ].filter(Boolean) as string[];

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
        {restrictions.length > 0 && (
          <View style={themedStyles.restrictionsContainer}>
            {restrictions.map((label) => (
              <View key={label} style={themedStyles.restrictionBadge}>
                <CustomText
                  font="chip"
                  weight="medium"
                  text={label}
                  overrideStyle={themedStyles.restrictionText}
                />
              </View>
            ))}
          </View>
        )}
        <View style={themedStyles.locationContainer}>
          <Image source={Images.location} />
          <CustomText
            font="chip"
            weight="medium"
            text={
              booking.court?.branch?.location?.name ??
              booking.court?.location?.name ??
              booking.court?.branch?.name ??
              ""
            }
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
          <AmountDisplay
            amount={sharePerPlayer}
            currency={booking.court.currency}
          />
          <View style={themedStyles.divider} />
          <View style={themedStyles.timeContainer}>
            <Image source={Images.timeCircle} style={themedStyles.timerIcon} />
            <CustomText text={convertToUTCTime(booking.startDate, booking.timeZone)} />
          </View>
        </View>
        {showBookNowButton && (
          <CustomButton
            title={t("openMatch.bookNow")}
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
