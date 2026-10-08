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
import { RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { useListEntering } from "utils";

const CurrentBookings = () => {
  const {
    bookingsData,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isMyBooking,
    onBookingPress,
    profileData,
  } = useCurrentBookings();
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const entering = useListEntering();

  const renderItem = ({ item, index }: ListRenderItemInfo<Booking>) => {
    const isMyCurrentBooking = !!isMyBooking(item);
    const currentParticipant = item.participants.find(
      (participant) => participant.userId === profileData?.id
    );
    const isParticipantReady =
      currentParticipant?.status === ParticipantStatus.READY;

    return (
      <Animated.View entering={entering(index)}>
        {isMyCurrentBooking || isParticipantReady ? (
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
        )}
      </Animated.View>
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
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.INK}
          colors={[colors.INK]}
        />
      }
      contentContainerStyle={themedStyles.contentContainer}
      overrideLoaderContainerStyle={themedStyles.loader}
      ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      emptyConfig={{
        image: Images.emptyBooking,
        title: t("activity.noBookings"),
        subtitle: t("activity.noBookingsSubtitle"),
      }}
    />
  );
};

export default CurrentBookings;
