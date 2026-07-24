import { CustomText } from "atoms/index";
import { DottedContainer } from "molecules/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { useThemeContext } from "contexts";
import styles from "./CourtBookingCard.styles";
import { Images } from "theme";
import { CourtBookingCardProps } from "./CourtBookingCard.types";
import { formatDate } from "utils";
import { AvatarSlots } from "organisms/index";

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
  return (
    <DottedContainer overrideStyle={themedStyles.confirmationContainer}>
      <View style={themedStyles.infoContainer}>
        <Image source={Images.openMatch} style={themedStyles.courtImage} />
        <View>
          <CustomText
            text={courtData.name}
            font="bottomSheetTitle"
            weight="bold"
            overrideStyle={themedStyles.courtName}
          />
          <View style={themedStyles.locationContainer}>
            <Image
              source={Images.outlinedLocation}
              style={themedStyles.locationIcon}
            />
            <CustomText
              text={courtData.location.name ?? ""}
              font="chip"
              weight="medium"
              overrideStyle={[
                themedStyles.branchName,
                themedStyles.branchNameText,
              ]}
            />
          </View>
          <View style={themedStyles.dateContainer}>
            <View style={themedStyles.iconContainer}>
              <Image source={Images.calendar} style={themedStyles.icon} />
              <CustomText
                text="Date"
                font="chip"
                weight="medium"
                overrideStyle={themedStyles.branchName}
              />
            </View>
            <CustomText
              font="chip"
              weight="semiBold"
              text={formatDate(selectedDate.toString(), "dd MMM yyyy")}
              overrideStyle={themedStyles.dateText}
              numberOfLines={1}
            />
          </View>
          <View style={themedStyles.dateContainer}>
            <View style={themedStyles.iconContainer}>
              <Image source={Images.timeCircle} style={themedStyles.icon} />
              <CustomText
                font="chip"
                text="Time"
                weight="medium"
                overrideStyle={themedStyles.branchName}
              />
            </View>
            <CustomText font="chip" weight="semiBold" text={selectedTime} />
          </View>
        </View>
      </View>
      <View style={themedStyles.slotsContainer}>
        <AvatarSlots showRemoveButton={showRemoveButton} slots={participants} />
      </View>
    </DottedContainer>
  );
};

export default CourtBookingCard;
