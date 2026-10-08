import {
  ActionItem,
  Card,
  Chip,
  CustomButton,
  CustomText,
  PressableScale,
} from "atoms/index";
import { Header } from "molecules/index";
import ReviewCourtModal from "molecules/modals/ReviewCourtModal/ReviewCourtModal.component";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import styles from "./BookingDetails.styles";
import { useThemeContext } from "contexts";
import { useTranslation } from "react-i18next";
import { useBookingDetails } from "./BookingDetails.logic";
import {
  enterRise,
  formatCurrency,
  formatDate,
  getCourtImage,
  mapSportGame,
} from "utils";

const BookingDetailsScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();

  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    onActivityLogPress,
    item,
    statusPill,
    formattedTime,
    bookingTicketButton,
    cancelAction,
    cancellationClosed,
    reviewCourtModalRef,
  } = useBookingDetails();

  const courtImage = getCourtImage(item.court);
  const sport = item.court.sport ? mapSportGame(item.court.sport) : undefined;
  // A court has no location of its own unless the vendor picked one, so
  // fall back to the branch before giving up. Dereferencing
  // `location.name` crashed this screen for every such court.
  const locationName =
    item.court.location?.name ??
    item.court.branch?.location?.name ??
    item.court.branch?.name ??
    "";

  return (
    <MainWrapper
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header
        whiteColor
        title={t("activity.bookingDetails")}
        trailingComponent={
          <PressableScale
            onPress={onActivityLogPress}
            style={themedStyles.restoreContainer}
            accessibilityRole="button"
            accessibilityLabel={t("activity.activityLog")}
          >
            <Image source={Images.restore} style={themedStyles.restoreIcon} />
          </PressableScale>
        }
      />
      <View style={themedStyles.content}>
        <Animated.View entering={enterRise(0)}>
          <Card overrideStyle={themedStyles.courtCard}>
            <ImageBackground
              source={courtImage}
              style={themedStyles.courtImage}
              imageStyle={themedStyles.courtImageInner}
            >
              <View style={themedStyles.imageBadges}>
                {statusPill ? (
                  <Chip
                    title={statusPill.title}
                    isSelected={false}
                    variant={statusPill.variant}
                    size="small"
                  />
                ) : (
                  <View />
                )}
                <View style={themedStyles.ratingBadge}>
                  <Image
                    source={Images.star}
                    style={themedStyles.ratingBadgeIcon}
                  />
                  <CustomText
                    text={Number(item.court.avgRating ?? 0).toFixed(1)}
                    font="caption"
                    weight="semiBold"
                    overrideStyle={themedStyles.ratingBadgeText}
                  />
                </View>
              </View>
            </ImageBackground>
            <View style={themedStyles.courtInfoContainer}>
              <CustomText
                text={item.court.name}
                font="screenTitle"
                weight="extraBold"
                uppercase={false}
                numberOfLines={2}
              />
              <View style={themedStyles.metaContainer}>
                <View style={themedStyles.metaRow}>
                  <Image
                    source={Images.location}
                    style={themedStyles.metaIcon}
                  />
                  <CustomText
                    text={item.court.branch.name ?? ""}
                    font="caption"
                    weight="medium"
                    numberOfLines={1}
                    overrideStyle={themedStyles.metaText}
                  />
                </View>
                {!!locationName && (
                  <View style={themedStyles.metaRow}>
                    <Image
                      source={Images.discovery}
                      style={themedStyles.metaIcon}
                    />
                    <CustomText
                      text={locationName}
                      font="caption"
                      weight="regular"
                      numberOfLines={1}
                      overrideStyle={themedStyles.metaText}
                    />
                  </View>
                )}
              </View>
              {!!sport && (
                <View style={themedStyles.chipsRow}>
                  <Chip
                    title={sport.name}
                    isSelected={false}
                    variant="feature"
                    size="small"
                  />
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={enterRise(1)}>
          <Card overrideStyle={themedStyles.whenCard}>
            <View style={themedStyles.dateBlock}>
              <CustomText
                text={formatDate(item.startDate, "MMM")}
                font="overline"
                weight="semiBold"
                overrideStyle={themedStyles.dateBlockMonth}
              />
              <CustomText
                text={formatDate(item.startDate, "dd")}
                font="dayNumber"
                weight="bold"
                overrideStyle={themedStyles.dateBlockDay}
              />
            </View>
            <View style={themedStyles.whenItem}>
              <View style={themedStyles.whenLabelRow}>
                <Image source={Images.calendar} style={themedStyles.whenIcon} />
                <CustomText
                  text={t("general.date")}
                  font="caption"
                  weight="medium"
                  overrideStyle={themedStyles.mutedText}
                />
              </View>
              <CustomText
                font="cardTitle"
                weight="semiBold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                text={formatDate(item.startDate, "dd MMM yyyy")}
              />
            </View>
            <View style={themedStyles.verticalDivider} />
            <View style={themedStyles.whenItem}>
              <View style={themedStyles.whenLabelRow}>
                <Image source={Images.clock} style={themedStyles.whenIcon} />
                <CustomText
                  font="caption"
                  weight="medium"
                  text={t("general.time")}
                  overrideStyle={themedStyles.mutedText}
                />
              </View>
              <CustomText
                font="cardTitle"
                weight="semiBold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                text={formattedTime}
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={enterRise(2)}>
          <Card overrideStyle={themedStyles.card}>
            <View style={themedStyles.cardHeader}>
              <CustomText
                text={t("activity.playersJoined")}
                font="sectionTitle"
                weight="small"
                overrideStyle={themedStyles.cardHeaderText}
              />
              <View style={themedStyles.countBadge}>
                <CustomText
                  text={`${item.participants.length}`}
                  font="caption"
                  weight="semiBold"
                />
              </View>
            </View>
            {item.participants.map((participant, index) => (
              <View
                key={participant.id}
                style={[
                  themedStyles.participantsContainer,
                  index < item.participants.length - 1 &&
                    themedStyles.participantDivider,
                ]}
              >
                <Image
                  source={
                    participant.user.avatarUrl
                      ? { uri: participant.user.avatarUrl }
                      : Images.maleProfile
                  }
                  style={themedStyles.playerImage}
                />
                <View style={themedStyles.playerInfoContainer}>
                  <CustomText
                    text={`${participant.user.firstName} ${participant.user.lastName}`}
                    font="headline3"
                    weight="semiBold"
                    numberOfLines={1}
                  />
                  {participant.user.username && (
                    <CustomText
                      text={`@${participant.user.username}`}
                      font="caption"
                      weight="regular"
                      numberOfLines={1}
                      overrideStyle={themedStyles.mutedText}
                    />
                  )}
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={enterRise(3)}>
          <Card overrideStyle={themedStyles.card}>
            <CustomText
              text={t("activity.paymentInfo")}
              font="sectionTitle"
              weight="small"
              overrideStyle={themedStyles.cardHeaderText}
            />
            <ActionItem
              image={Images.court}
              title={t("activity.courtCost")}
              overrideTitleStyle={themedStyles.mutedText}
              overrideStyle={themedStyles.courtCostContainer}
              right={
                <CustomText
                  text={formatCurrency(Number(item.totalAmount))}
                  font="headline3"
                  weight="semiBold"
                />
              }
            />
            <View style={themedStyles.divider} />
            <View style={themedStyles.totalContainer}>
              <CustomText
                text={t("general.total")}
                font="headline3"
                weight="medium"
                overrideStyle={themedStyles.mutedText}
              />
              <CustomText
                text={formatCurrency(Number(item.totalAmount))}
                font="displayNumber"
                weight="extraBold"
              />
            </View>
            <ActionItem
              image={Images.card}
              title={t("activity.paymentStatus")}
              overrideStyle={themedStyles.paymentStatusContainer}
              right={
                <CustomText
                  text={formatCurrency(Number(item.totalAmount))}
                  font="headline3"
                  weight="bold"
                />
              }
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={enterRise(4)}
          style={themedStyles.actionsContainer}
        >
          <CustomButton
            variant="primary"
            onPress={bookingTicketButton.onPress}
            title={bookingTicketButton.title}
          />
          {cancelAction && (
            <CustomButton
              variant="danger"
              onPress={cancelAction.onPress}
              title={cancelAction.title}
            />
          )}
          {cancellationClosed && (
            <CustomText
              text={t("activity.cancelClosed")}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.cancelClosed}
            />
          )}
        </Animated.View>
      </View>
      <ReviewCourtModal
        onClose={() => reviewCourtModalRef.current?.dismiss()}
        ref={reviewCourtModalRef}
        courtName={item.court.name}
        bookingId={item.id}
      />
    </MainWrapper>
  );
};

export default BookingDetailsScreen;
