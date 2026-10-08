import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { BookingSummaryCardProps } from "./BookingSummaryCard.types";
import { Card, Chip, CustomButton, CustomText } from "atoms/index";
import { MatchStatus } from "models";
import { Images } from "theme";
import { useThemeContext } from "contexts";
import styles from "./BookingSummaryCard.styles";
import { useTranslation } from "react-i18next";
import { useBookingSummaryCard } from "./BookingSummaryCard.logic";
import ReviewCourtModal from "molecules/modals/ReviewCourtModal/ReviewCourtModal.component";
import { formatInZone } from "utils";

const MAX_VISIBLE_FRIENDS = 4;

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
    statusPill,
  } = useBookingSummaryCard({ item, profileId });

  const zone = item.timeZone;
  const startTime = formatInZone(item.startDate, "HH:mm", zone);
  const endTime = formatInZone(item.endDate, "HH:mm", zone);
  const timeRange = `${startTime} – ${endTime}`;
  const rating = Number(item.review?.rating ?? court.avgRating ?? 0).toFixed(1);
  const visibleFriends = participants.slice(0, MAX_VISIBLE_FRIENDS);
  const hiddenFriends = participants.length - visibleFriends.length;

  const renderButton = () => {
    if (isLessThan10Minutes) {
      return (
        <CustomButton
          title={t("activity.enterCourt")}
          variant="primary"
          size="medium"
          onPress={onEnterMatch}
          overrideStyle={themedStyles.button}
        />
      );
    }

    // "Capture moment" has no create-moment flow behind it yet; a button
    // that does nothing during a live match is worse than none.

    if (item.status === MatchStatus.COMPLETED && !item.review) {
      return (
        <CustomButton
          title={t("activity.addReview")}
          variant="outline"
          size="medium"
          onPress={onShowReviewCourtModal}
          overrideStyle={themedStyles.button}
          leftIcon={
            <Image source={Images.review} style={themedStyles.buttonIcon} />
          }
        />
      );
    }
    return;
  };

  return (
    <>
      <Card overrideStyle={themedStyles.container} onPress={onPress}>
        <View style={themedStyles.ticket}>
          <View style={themedStyles.dateBlock}>
            <CustomText
              font="overline"
              weight="semiBold"
              text={formatInZone(item.startDate, "EEE", zone)}
              numberOfLines={1}
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
              numberOfLines={1}
              overrideStyle={themedStyles.dateBlockMonth}
            />
          </View>

          <View style={themedStyles.info}>
            <View style={themedStyles.topRow}>
              <View style={themedStyles.sportRow}>
                <Image
                  source={Images[sport.icon]}
                  style={themedStyles.sportIcon}
                />
                <CustomText
                  font="caption"
                  weight="medium"
                  text={t("activity.bookedCourt", { sport: sport.name })}
                  numberOfLines={1}
                  overrideStyle={themedStyles.mutedText}
                />
              </View>
              {statusPill && (
                <Chip
                  title={statusPill.title}
                  isSelected={false}
                  variant={statusPill.variant}
                  size="small"
                  overrideStyle={themedStyles.statusPill}
                />
              )}
            </View>
            <CustomText
              font="cardTitle"
              weight="bold"
              text={court.name}
              numberOfLines={1}
              overrideStyle={themedStyles.courtName}
            />
            <View style={themedStyles.metaRow}>
              <Image source={Images.clock} style={themedStyles.timeIcon} />
              <CustomText
                font="caption"
                weight="semiBold"
                text={timeRange}
                numberOfLines={1}
                overrideStyle={themedStyles.timeText}
              />
            </View>
            {!!court.branch?.name && (
              <View style={themedStyles.metaRow}>
                <Image source={Images.location} style={themedStyles.metaIcon} />
                <CustomText
                  font="caption"
                  weight="regular"
                  text={court.branch.name}
                  numberOfLines={1}
                  overrideStyle={themedStyles.metaText}
                />
              </View>
            )}
          </View>
        </View>

        <View style={themedStyles.footer}>
          {participants.length > 0 ? (
            <View style={themedStyles.friends}>
              <View style={themedStyles.avatars}>
                {visibleFriends.map((participant, index) => (
                  <Image
                    key={participant.id}
                    source={
                      participant.user.avatarUrl
                        ? { uri: participant.user.avatarUrl }
                        : Images.maleProfile
                    }
                    style={[
                      themedStyles.friendIcon,
                      index > 0 && themedStyles.friendOverlap,
                    ]}
                  />
                ))}
                {hiddenFriends > 0 && (
                  <View
                    style={[
                      themedStyles.friendIcon,
                      themedStyles.friendOverlap,
                      themedStyles.moreFriends,
                    ]}
                  >
                    <CustomText
                      text={`+${hiddenFriends}`}
                      font="caption"
                      weight="semiBold"
                      overrideStyle={themedStyles.moreFriendsText}
                    />
                  </View>
                )}
              </View>
              <CustomText
                text={t("general.friends")}
                font="caption"
                weight="medium"
                numberOfLines={1}
                overrideStyle={themedStyles.mutedText}
              />
            </View>
          ) : (
            <View />
          )}
          <View style={themedStyles.ratingContainer}>
            <Image source={Images.star} style={themedStyles.starIcon} />
            <CustomText
              font="caption"
              weight="semiBold"
              text={rating}
              overrideStyle={themedStyles.rating}
            />
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
