import List from "organisms/List/List.component";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useBookingHistory } from "./BookingHistory.logic";
import { BookingSummaryCard } from "molecules/index";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Booking } from "models";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./BookingHistory.styles";

const BookingHistory = () => {
  const {
    bookingsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onBookingDetailsPress,
    profileData,
  } = useBookingHistory();
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const renderItem = ({ item }: ListRenderItemInfo<Booking>) => {
    return (
      <BookingSummaryCard
        profileId={profileData?.id ?? ""}
        item={item}
        onPress={() => onBookingDetailsPress(item)}
      />
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
      emptyConfig={{
        image: Images.emptyBooking,
        title: t("activity.noBookings"),
      }}
      ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
    />
  );
};

export default BookingHistory;
