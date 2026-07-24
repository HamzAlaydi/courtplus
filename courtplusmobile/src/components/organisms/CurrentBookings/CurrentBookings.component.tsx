import React, { useMemo } from "react";
import { useCurrentBookings } from "./CurrentBookings.logic";
import List from "organisms/List/List.component";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Booking, ParticipantStatus } from "models";
import { BookingSummaryCard, MatchInvitationCard } from "molecules/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./CurrentBookings.styles";
import { View } from "react-native";

const CurrentBookings = () => {
  const {
    bookingsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isMyBooking,
    onBookingPress,
    profileData,
  } = useCurrentBookings();
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const renderItem = ({ item }: ListRenderItemInfo<Booking>) => {
    const isMyCurrentBooking = !!isMyBooking(item);
    const currentParticipant = item.participants.find(
      (participant) => participant.userId === profileData?.id
    );
    const isParticipantReady =
      currentParticipant?.status === ParticipantStatus.READY;

    return isMyCurrentBooking || isParticipantReady ? (
      <BookingSummaryCard
        profileId={profileData?.id ?? ""}
        item={item}
        onPress={() => onBookingPress(item)}
      />
    ) : (
      <MatchInvitationCard
        item={item}
        onPress={() => onBookingPress(item)}
        participant={currentParticipant!!}
      />
    );
  };
  return (
    <List
      data={bookingsData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      contentContainerStyle={themedStyles.contentContainer}
      overrideLoaderContainerStyle={themedStyles.loader}
      ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      emptyConfig={{
        image: Images.emptyBooking,
        title: t("activity.noBookings"),
      }}
    />
  );
};

export default CurrentBookings;
