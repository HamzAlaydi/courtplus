import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "./MatchInvitationCard.styles";
import { CustomText } from "atoms/index";
import ButtonsRow from "molecules/ButtonsRow/ButtonsRow.component";
import { useTranslation } from "react-i18next";
import { MatchInvitationCardProps } from "./MatchInvitationCard.types";
import CourtBookingCard from "molecules/CourtBookingCard/CourtBookingCard.component";
import { User } from "models";
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
          text={formatCurrency(Number(item.totalAmount))}
        />
      </View>
      <CourtBookingCard
        courtData={item.court}
        showRemoveButton={false}
        selectedDate={new Date(item.startDate)}
        selectedTime={`${convertToUTCTime(item.startDate)}-${convertToUTCTime(
          item.endDate
        )}`}
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
