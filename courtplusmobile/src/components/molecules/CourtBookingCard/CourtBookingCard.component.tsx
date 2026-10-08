import { CustomText } from "atoms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { useThemeContext } from "contexts";
import styles from "./CourtBookingCard.styles";
import { Images } from "theme";
import { CourtBookingCardProps } from "./CourtBookingCard.types";
import { formatDate, getCourtImage } from "utils";
import { AvatarSlots } from "organisms/index";
import { useTranslation } from "react-i18next";

const CourtBookingCard = ({
  courtData,
  selectedDate,
  selectedTime,
  participants,
  showRemoveButton = true,
}: CourtBookingCardProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  // Same null-location fallback as BookingDetails: this card renders in the
  // booking summary and in match invitations, so an unguarded dereference
  // broke both the payment step and the Current tab.
  const locationName =
    courtData.location?.name ??
    courtData.branch?.location?.name ??
    courtData.branch?.name ??
    "";

  const details = [
    {
      key: "date",
      icon: Images.calendar,
      label: t("general.date"),
      value: formatDate(selectedDate.toString(), "dd MMM yyyy"),
    },
    {
      key: "time",
      icon: Images.timeCircle,
      label: t("general.time"),
      value: selectedTime,
    },
  ];

  return (
    <View style={themedStyles.confirmationContainer}>
      <View style={themedStyles.infoContainer}>
        <Image
          source={getCourtImage(courtData)}
          style={themedStyles.courtImage}
        />
        <View style={themedStyles.courtInfo}>
          <CustomText
            text={courtData.name}
            font="cardTitle"
            weight="bold"
            numberOfLines={2}
            overrideStyle={themedStyles.courtName}
          />
          {!!locationName && (
            <View style={themedStyles.locationContainer}>
              <Image
                source={Images.location}
                style={themedStyles.locationIcon}
              />
              <CustomText
                text={locationName}
                font="caption"
                weight="regular"
                numberOfLines={1}
                overrideStyle={themedStyles.branchName}
              />
            </View>
          )}
        </View>
      </View>
      <View style={themedStyles.detailsRow}>
        {details.map((detail) => (
          <View key={detail.key} style={themedStyles.detailTile}>
            <View style={themedStyles.iconContainer}>
              <Image source={detail.icon} style={themedStyles.icon} />
              <CustomText
                text={detail.label}
                font="caption"
                weight="medium"
                overrideStyle={themedStyles.label}
              />
            </View>
            <CustomText
              font="headline3"
              weight="semiBold"
              text={detail.value}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              overrideStyle={themedStyles.value}
            />
          </View>
        ))}
      </View>
      <View style={themedStyles.divider} />
      <View style={themedStyles.slotsContainer}>
        <AvatarSlots showRemoveButton={showRemoveButton} slots={participants} />
      </View>
    </View>
  );
};

export default CourtBookingCard;
