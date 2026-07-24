import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { BookingSummaryCardProps } from "./BookingSummaryCard.types";
import { Card, CustomButton, CustomText } from "atoms/index";
import { MatchStatus, ParticipantStatus } from "models";
import { Images } from "theme";
import { useThemeContext } from "contexts";
import styles from "./BookingSummaryCard.styles";
import { useTranslation } from "react-i18next";
import { useBookingSummaryCard } from "./BookingSummaryCard.logic";
import ReviewCourtModal from "molecules/modals/ReviewCourtModal/ReviewCourtModal.component";
import { getCourtImage } from "utils";

const BookingSummaryCard = ({
  item,
  onPress,
  profileId,
}: BookingSummaryCardProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    isLessThan10Minutes,
    participants,
    court,
    sport,
    onEnterMatch,
    reviewCourtModalRef,
    onDismissReviewCourtModal,
    onShowReviewCourtModal,
    currentParticipant,
  } = useBookingSummaryCard({ item, profileId });

  const courtImage = getCourtImage(item.court);

  const renderButton = () => {
    if (isLessThan10Minutes) {
      return (
        <CustomButton
          title={t("activity.enterCourt")}
          onPress={onEnterMatch}
          overrideStyle={themedStyles.button}
        />
      );
    }

    if (
      currentParticipant?.status === ParticipantStatus.ENTERED &&
      item.status !== MatchStatus.COMPLETED
    ) {
      return (
        <CustomButton
          title={t("activity.captureMoment")}
          onPress={() => {}}
          overrideStyle={themedStyles.button}
          leftIcon={<Image source={Images.capture} />}
        />
      );
    }

    if (item.status === MatchStatus.COMPLETED && !item.review) {
      return (
        <CustomButton
          title={t("activity.addReview")}
          onPress={onShowReviewCourtModal}
          overrideStyle={themedStyles.button}
          leftIcon={<Image source={Images.review} />}
        />
      );
    }
    return;
  };

  return (
    <>
      <Card overrideStyle={themedStyles.container} onPress={onPress}>
        <View style={themedStyles.header}>
          <View style={themedStyles.iconContainer}>
            <Image source={Images[sport.icon]} />
            <CustomText
              font="headline3"
              weight="semiBold"
              text={t("activity.bookedCourt", { sport: sport.name })}
              overrideStyle={themedStyles.text}
            />
          </View>
        </View>
        <View style={themedStyles.courtContainer}>
          <View style={themedStyles.courtInfoContainer}>
            <Image source={courtImage} style={themedStyles.courtImage} />
            <View style={themedStyles.branchContainer}>
              <CustomText
                font="chip"
                weight="medium"
                text={court.branch.name}
                overrideStyle={themedStyles.branchName}
              />
              <CustomText
                font="fields"
                weight="semiBold"
                text={court.name}
                overrideStyle={themedStyles.courtName}
              />
            </View>
          </View>
          <View style={themedStyles.ratingContainer}>
            <Image source={Images.star} />
            <CustomText
              font="headline3"
              weight="semiBold"
              text={`${item.review?.rating ?? court.avgRating}`}
              overrideStyle={themedStyles.rating}
            />
          </View>
        </View>
        <View style={themedStyles.friendsContainer}>
          <CustomText
            text={t("general.friends")}
            font="text"
            weight="semiBold"
            overrideStyle={themedStyles.friendsText}
          />
          <View style={themedStyles.participantsContainer}>
            {participants.map((participant) => (
              <View key={participant.id}>
                <Image
                  source={
                    participant.user.avatarUrl
                      ? { uri: participant.user.avatarUrl }
                      : Images.maleProfile
                  }
                  style={themedStyles.friendIcon}
                />
              </View>
            ))}
          </View>
        </View>
        {renderButton()}
      </Card>
      <ReviewCourtModal
        onClose={onDismissReviewCourtModal}
        ref={reviewCourtModalRef}
        courtName={court.name}
        bookingId={item.id}
      />
    </>
  );
};

export default BookingSummaryCard;
