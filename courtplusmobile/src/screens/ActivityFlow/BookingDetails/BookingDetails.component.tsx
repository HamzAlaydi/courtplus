import { ActionItem, Card, CustomButton, CustomText } from "atoms/index";
import { Header } from "molecules/index";
import ReviewCourtModal from "molecules/modals/ReviewCourtModal/ReviewCourtModal.component";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./BookingDetails.styles";
import { useThemeContext } from "contexts";
import { useTranslation } from "react-i18next";
import { useBookingDetails } from "./BookingDetails.logic";
import { formatCurrency, formatDate, getCourtImage } from "utils";

const BookingDetailsScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();

  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    onActivityLogPress,
    item,
    formattedTime,
    bookingTicketButton,
    cancelAction,
    cancellationClosed,
    reviewCourtModalRef,
  } = useBookingDetails();

  const courtImage = getCourtImage(item.court);

  return (
    <MainWrapper
      whiteBackground
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header
        whiteColor
        title={t("activity.bookingDetails")}
        overrideStyle={themedStyles.header}
        trailingComponent={
          <TouchableOpacity
            onPress={onActivityLogPress}
            style={themedStyles.restoreContainer}
          >
            <Image source={Images.restore} />
          </TouchableOpacity>
        }
      />
      <View style={themedStyles.content}>
        <Card disabled overrideStyle={themedStyles.courtCard}>
          <Image source={courtImage} style={themedStyles.courtImage} />
          <View style={themedStyles.courtInfoContainer}>
            <CustomText
              text={item.court.name}
              font="bottomSheetTitle"
              weight="bold"
            />
            <View style={themedStyles.ratingContainer}>
              <Image source={Images.star} />
              <CustomText
                text={item.court.avgRating.toString()}
                font="headline3"
                weight="semiBold"
                overrideStyle={themedStyles.rating}
              />
            </View>
            <View style={themedStyles.branchContainer}>
              <Image source={Images.location} />
              <CustomText
                text={item.court.branch.name ?? ""}
                font="headline3"
                weight="semiBold"
                overrideStyle={themedStyles.branchName}
              />
            </View>
            <View style={themedStyles.distanceContainer}>
              <Image source={Images.discovery} />
              <CustomText
                // A court has no location of its own unless the vendor picked one, so
                // fall back to the branch before giving up. Dereferencing
                // `location.name` crashed this screen for every such court.
                text={
                  item.court.location?.name ??
                  item.court.branch?.location?.name ??
                  item.court.branch?.name ??
                  ""
                }
                font="chip"
                weight="regular"
                overrideStyle={themedStyles.location}
              />
            </View>
          </View>
        </Card>
        <Card disabled overrideStyle={themedStyles.card}>
          <CustomText
            text={t("activity.playersJoined")}
            font="chip"
            weight="semiBold"
            overrideStyle={themedStyles.playersJoined}
          />
          {item.participants.map((participant) => (
            <View
              key={participant.id}
              style={themedStyles.participantsContainer}
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
                  overrideStyle={themedStyles.playerName}
                />
                {participant.user.username && (
                  <CustomText
                    text={`@${participant.user.username}`}
                    font="chip"
                    weight="medium"
                    overrideStyle={themedStyles.playerUsername}
                  />
                )}
              </View>
            </View>
          ))}
        </Card>
        <Card
          disabled
          overrideStyle={[themedStyles.card, themedStyles.dateContainer]}
        >
          <View style={themedStyles.dateItem}>
            <View style={themedStyles.dateIconContainer}>
              <Image source={Images.calendar} style={themedStyles.dateIcon} />
              <CustomText
                text={t("general.date")}
                font="headline3"
                weight="semiBold"
                overrideStyle={themedStyles.date}
              />
            </View>
            <CustomText
              font="headline2"
              weight="bold"
              text={formatDate(item.startDate, "dd MMM yyyy")}
            />
          </View>
          <View style={themedStyles.dateItem}>
            <View style={themedStyles.dateIconContainer}>
              <Image source={Images.clock} style={themedStyles.dateIcon} />
              <CustomText
                font="headline3"
                weight="semiBold"
                text={t("general.time")}
                overrideStyle={themedStyles.date}
              />
            </View>
            <CustomText font="headline2" weight="bold" text={formattedTime} />
          </View>
        </Card>

        <Card disabled overrideStyle={themedStyles.card}>
          <CustomText
            text={t("activity.paymentInfo")}
            font="chip"
            weight="semiBold"
            overrideStyle={themedStyles.paymentInfoText}
          />
          <ActionItem
            image={Images.court}
            title={t("activity.courtCost")}
            overrideTitleStyle={themedStyles.courtCostText}
            overrideStyle={themedStyles.courtCostContainer}
            right={
              <CustomText
                text={formatCurrency(Number(item.totalAmount))}
                font="fields"
                weight="semiBold"
              />
            }
          />
          <View style={themedStyles.divider} />
          <View style={themedStyles.totalContainer}>
            <CustomText
              text={t("general.total")}
              font="body"
              weight="medium"
              overrideStyle={themedStyles.total}
            />
            <CustomText
              text={formatCurrency(Number(item.totalAmount))}
              font="headline1"
              weight="bold"
              overrideStyle={themedStyles.amount}
            />
          </View>
          <ActionItem
            image={Images.court}
            title={t("activity.paymentStatus")}
            overrideTitleStyle={themedStyles.paymentStatusText}
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
        <CustomButton
          onPress={bookingTicketButton.onPress}
          title={bookingTicketButton.title}
        />
        {cancelAction && (
          <CustomButton
            variant="bordered"
            onPress={cancelAction.onPress}
            title={cancelAction.title}
            overrideStyle={{ marginTop: 12 }}
          />
        )}
        {cancellationClosed && (
          <CustomText
            text={t("activity.cancelClosed")}
            font="body"
            overrideStyle={{ marginTop: 12, textAlign: "center", opacity: 0.7 }}
          />
        )}
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
