import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./OpenMatchItem.styles";
import { OpenMatchItemProps } from "./OpenMatchItem.types";
import { convertToUTCTime, formatInZone, mapSportItem } from "utils";
import { useTranslation } from "react-i18next";
import { Sport } from "models";

/** API levels are snake_case ("intermediate_high"); locale keys are camelCase. */
const camelCaseLevel = (level: string) =>
  level.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** Player slots drawn on the card before the rest collapse into "+n". */
const MAX_VISIBLE_SLOTS = 6;

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
    booking.level
      ? t(`general.${camelCaseLevel(booking.level)}`, booking.level)
      : null,
    booking.gender && booking.gender !== "other"
      ? t(`general.${booking.gender}`, booking.gender)
      : null,
  ].filter(Boolean) as string[];

  const zone = booking.timeZone;
  const players = booking.participants;
  const visibleSlots = Math.max(
    Math.min(seats, MAX_VISIBLE_SLOTS),
    Math.min(players.length, MAX_VISIBLE_SLOTS)
  );
  const visiblePlayers = players.slice(0, visibleSlots);
  const emptySlots = Math.max(0, visibleSlots - visiblePlayers.length);
  const hiddenSlots = Math.max(
    0,
    Math.max(seats, players.length) - visibleSlots
  );
  const venue =
    booking.court?.branch?.location?.name ??
    booking.court?.location?.name ??
    booking.court?.branch?.name ??
    "";

  return (
    <Card overrideStyle={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.topRow}>
        <View style={themedStyles.dateBlock}>
          <CustomText
            font="overline"
            weight="semiBold"
            text={formatInZone(booking.startDate, "EEE", zone)}
            overrideStyle={themedStyles.dateBlockDay}
          />
          <CustomText
            font="dayNumber"
            weight="bold"
            text={formatInZone(booking.startDate, "dd", zone)}
            overrideStyle={themedStyles.dateBlockNumber}
          />
          <CustomText
            font="overline"
            weight="semiBold"
            text={formatInZone(booking.startDate, "MMM", zone)}
            overrideStyle={themedStyles.dateBlockMonth}
          />
        </View>
        <View style={themedStyles.infoColumn}>
          <View style={themedStyles.timeRow}>
            <CustomText
              font="displayNumber"
              weight="bold"
              text={convertToUTCTime(booking.startDate, booking.timeZone)}
            />
            <CustomText
              font="caption"
              weight="medium"
              text={`– ${convertToUTCTime(booking.endDate, booking.timeZone)}`}
              overrideStyle={themedStyles.mutedText}
            />
          </View>
          <CustomText
            text={booking.court.name}
            font="cardTitle"
            weight="semiBold"
            numberOfLines={1}
          />
          {!!venue && (
            <View style={themedStyles.locationContainer}>
              <Image
                source={Images.location}
                style={themedStyles.locationIcon}
              />
              <CustomText
                font="caption"
                weight="regular"
                text={venue}
                numberOfLines={1}
                overrideStyle={themedStyles.locationText}
              />
            </View>
          )}
        </View>
      </View>

      <View style={themedStyles.chipsRow}>
        <Chip
          title={sport.name}
          isSelected={false}
          variant="feature"
          size="small"
          leftComponent={
            <Image source={Images[sport.icon]} style={themedStyles.sportIcon} />
          }
        />
        {restrictions.map((label) => (
          <Chip key={label} title={label} isSelected={false} size="small" />
        ))}
      </View>

      <View style={themedStyles.playersRow}>
        <View style={themedStyles.slots}>
          {visiblePlayers.map((player, index) => (
            <Image
              key={player.id}
              source={
                player.user?.avatarUrl
                  ? { uri: player.user.avatarUrl }
                  : Images.maleProfile
              }
              style={[themedStyles.slot, index > 0 && themedStyles.slotOverlap]}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <View
              key={`empty-${index}`}
              style={[
                themedStyles.slot,
                themedStyles.emptySlot,
                (visiblePlayers.length > 0 || index > 0) &&
                  themedStyles.slotOverlap,
              ]}
            >
              <Image source={Images.plus} style={themedStyles.emptySlotIcon} />
            </View>
          ))}
          {hiddenSlots > 0 && (
            <View
              style={[
                themedStyles.slot,
                themedStyles.moreSlot,
                themedStyles.slotOverlap,
              ]}
            >
              <CustomText
                font="caption"
                weight="semiBold"
                text={`+${hiddenSlots}`}
                overrideStyle={themedStyles.moreSlotText}
              />
            </View>
          )}
        </View>
        <View style={themedStyles.countPill}>
          <CustomText
            font="caption"
            weight="semiBold"
            text={`${players.length}/${seats}`}
          />
        </View>
      </View>

      <View style={themedStyles.footer}>
        <View style={themedStyles.priceRow}>
          <CustomText
            font="displayNumber"
            weight="bold"
            text={`${sharePerPlayer}`}
          />
          <CustomText
            font="caption"
            weight="medium"
            text={booking.court.currency ?? t("general.currency")}
            overrideStyle={themedStyles.mutedText}
          />
        </View>
        {showBookNowButton && (
          <CustomButton
            title={t("openMatch.bookNow")}
            variant="primary"
            size="small"
            onPress={onBookNowPress}
            overrideStyle={themedStyles.button}
          />
        )}
      </View>
    </Card>
  );
};

export default OpenMatchItem;
