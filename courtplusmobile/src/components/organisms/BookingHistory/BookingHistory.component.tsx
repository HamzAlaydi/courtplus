import List from "organisms/List/List.component";
import React, { useMemo } from "react";
import { RefreshControl, View } from "react-native";
import { useBookingHistory } from "./BookingHistory.logic";
import { BookingSummaryCard } from "molecules/index";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Booking } from "models";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./BookingHistory.styles";
import Animated from "react-native-reanimated";
import { useListEntering } from "utils";

const BookingHistory = () => {
  const {
    bookingsData,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    onBookingDetailsPress,
    profileData,
  } = useBookingHistory();
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const entering = useListEntering();

  const renderItem = ({ item, index }: ListRenderItemInfo<Booking>) => {
    return (
      <Animated.View entering={entering(index)}>
        <BookingSummaryCard
          profileId={profileData?.id ?? ""}
          item={item}
          onPress={() => onBookingDetailsPress(item)}
        />
      </Animated.View>
    );
  };
  return (
    <List
      contentContainerStyle={themedStyles.contentContainer}
      data={bookingsData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      overrideLoaderContainerStyle={themedStyles.loader}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.INK}
          colors={[colors.INK]}
        />
      }
      emptyConfig={{
        image: Images.emptyBooking,
        title: t("activity.noBookings"),
        subtitle: t("activity.noBookingsSubtitle"),
      }}
      ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
    />
  );
};

export default BookingHistory;
