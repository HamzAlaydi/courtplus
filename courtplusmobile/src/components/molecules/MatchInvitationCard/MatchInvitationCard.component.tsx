import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, Text, View } from "react-native";
import styles from "./MatchInvitationCard.styles";
import { CustomText, PressableScale } from "atoms/index";
import ButtonsRow from "molecules/ButtonsRow/ButtonsRow.component";
import { useTranslation } from "react-i18next";
import { MatchInvitationCardProps } from "./MatchInvitationCard.types";
import { Booking, PaymentType } from "models";
import { Images } from "theme";
import { convertToUTCTime, formatInZone } from "utils";
import { useMatchInvitationCard } from "./MatchInvitationCard.logic";

/** Avatars drawn before the rest collapse into "+n". */
const MAX_VISIBLE_PLAYERS = 5;

const MatchInvitationCard = ({
  onPress,
  overrideStyle,
  item,
  participant,
}: MatchInvitationCardProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { secondaryButton, creator, handleReject } = useMatchInvitationCard({
    participant,
    booking: item,
  });

  // The invitee of a split booking is asked for ONE seat, but the card printed
  // the whole court price next to "Pay your part". Mirrors the backend seat
  // rule (backend booking.constants#splitSeatCount): an open match is shared
  // by every seat on the court, a private split by the invitees plus the host.
  const amountDue = useMemo(() => {
    const total = Number(item.totalAmount);
    if (item.paymentType !== PaymentType.SPLIT) return total;
    // `playersASide` is returned by the API but missing from the Booking model.
    const { playersASide } = item as Booking & { playersASide?: number };
    const seats = item.open
      ? Math.max(2, (playersASide ?? 1) * 2)
      : (item.participants?.filter((player) => !player.isCreator).length ?? 0) +
        1;
    return Math.round((total / seats) * 100) / 100;
  }, [item]);

  const zone = item.timeZone;
  const location =
    item.court.location?.name ??
    item.court.branch?.location?.name ??
    item.court.branch?.name ??
    "";
  const visiblePlayers = item.participants.slice(0, MAX_VISIBLE_PLAYERS);
  const hiddenPlayers = item.participants.length - visiblePlayers.length;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={[themedStyles.container, overrideStyle]}
    >
      <View style={themedStyles.invitation}>
        <Image
          source={
            creator?.user?.avatarUrl
              ? { uri: creator.user.avatarUrl }
              : Images.maleProfile
          }
          style={themedStyles.creatorAvatar}
        />
        <Text style={themedStyles.invitationText} numberOfLines={2}>
          <CustomText
            text={`${creator?.user.firstName ?? ""} `}
            font="headline3"
            weight="semiBold"
          />
          <CustomText
            text={t("activity.invitedMatch")}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
          />
        </Text>
      </View>

      <View style={themedStyles.ticket}>
        <View style={themedStyles.dateBlock}>
          <CustomText
            font="overline"
            weight="semiBold"
            text={formatInZone(item.startDate, "EEE", zone)}
            overrideStyle={themedStyles.dateBlockDay}
          />
          <CustomText
            font="dayNumber"
            weight="bold"
            text={formatInZone(item.startDate, "dd", zone)}
            overrideStyle={themedStyles.dateBlockNumber}
          />
          <CustomText
            font="overline"
            weight="semiBold"
            text={formatInZone(item.startDate, "MMM", zone)}
            overrideStyle={themedStyles.dateBlockMonth}
          />
        </View>
        <View style={themedStyles.ticketInfo}>
          <CustomText
            text={item.court.name}
            font="cardTitle"
            weight="semiBold"
            numberOfLines={1}
          />
          {!!location && (
            <View style={themedStyles.metaRow}>
              <Image source={Images.location} style={themedStyles.metaIcon} />
              <CustomText
                text={location}
                font="caption"
                weight="regular"
                numberOfLines={1}
                overrideStyle={themedStyles.metaText}
              />
            </View>
          )}
          <View style={themedStyles.metaRow}>
            <Image source={Images.clock} style={themedStyles.metaIcon} />
            <CustomText
              text={`${convertToUTCTime(
                item.startDate,
                item.timeZone
              )} – ${convertToUTCTime(item.endDate, item.timeZone)}`}
              font="caption"
              weight="semiBold"
            />
          </View>
        </View>
      </View>

      <View style={themedStyles.summaryRow}>
        <View style={themedStyles.players}>
          {visiblePlayers.map((player, index) => (
            <Image
              key={player.id}
              source={
                player.user?.avatarUrl
                  ? { uri: player.user.avatarUrl }
                  : Images.maleProfile
              }
              style={[
                themedStyles.playerAvatar,
                index > 0 && themedStyles.playerOverlap,
              ]}
            />
          ))}
          {hiddenPlayers > 0 && (
            <View
              style={[
                themedStyles.playerAvatar,
                themedStyles.playerOverlap,
                themedStyles.morePlayers,
              ]}
            >
              <CustomText
                text={`+${hiddenPlayers}`}
                font="caption"
                weight="semiBold"
                overrideStyle={themedStyles.morePlayersText}
              />
            </View>
          )}
        </View>
        <View style={themedStyles.amountRow}>
          <CustomText
            text={`${amountDue}`}
            font="displayNumber"
            weight="bold"
          />
          <CustomText
            text={t("general.currency")}
            font="caption"
            weight="medium"
            overrideStyle={themedStyles.description}
          />
        </View>
      </View>

      <ButtonsRow
        onPress={handleReject}
        onSecondaryPress={secondaryButton?.onPress ?? (() => {})}
        title={t("activity.reject")}
        secondaryTitle={secondaryButton?.title ?? ""}
        overrideStyle={themedStyles.buttonsRow}
      />
    </PressableScale>
  );
};

export default MatchInvitationCard;
