import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "./MatchInvitationCard.styles";
import { CustomText } from "atoms/index";
import ButtonsRow from "molecules/ButtonsRow/ButtonsRow.component";
import { useTranslation } from "react-i18next";
import { MatchInvitationCardProps } from "./MatchInvitationCard.types";
import CourtBookingCard from "molecules/CourtBookingCard/CourtBookingCard.component";
import { Booking, PaymentType, User } from "models";
import { convertToUTCTime, formatCurrency } from "utils";
import { useMatchInvitationCard } from "./MatchInvitationCard.logic";

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

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[themedStyles.container, overrideStyle]}
    >
      <View style={themedStyles.invitation}>
        <Text>
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
        <CustomText
          font="headline2"
          weight="semiBold"
          text={formatCurrency(amountDue)}
        />
      </View>
      <CourtBookingCard
        courtData={item.court}
        showRemoveButton={false}
        selectedDate={new Date(item.startDate)}
        selectedTime={`${convertToUTCTime(item.startDate, item.timeZone)}-${convertToUTCTime(item.endDate, item.timeZone)}`}
        participants={item.participants.map(
          (participant) => participant.user as User
        )}
      />
      <ButtonsRow
        onPress={handleReject}
        onSecondaryPress={secondaryButton?.onPress ?? (() => {})}
        title={t("activity.reject")}
        secondaryTitle={secondaryButton?.title ?? ""}
        overrideStyle={themedStyles.buttonsRow}
      />
    </TouchableOpacity>
  );
};

export default MatchInvitationCard;
