import { ActionIcon, BackButton, Chip, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, OpenMatchItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, View } from "react-native";
import { Images } from "theme";
import styles from "./OpenMatch.styles";
import { useOpenMatch } from "./OpenMatch.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Booking } from "models";

const OpenMatchScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const {
    bookingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isRefetching,
    refetch,
    onStartMatchPress,
    profileId,
    handleBookNow,
  } = useOpenMatch();

  const renderItem = ({ item }: ListRenderItemInfo<Booking>) => {
    const isMyBooking = item.participants.find(
      (participant) => participant.userId === profileId && participant.isCreator
    );
    return (
      <OpenMatchItem
        showBookNowButton={!isMyBooking}
        booking={item}
        onBookNowPress={() => handleBookNow(item)}
      />
    );
  };

  return (
    <View style={themedStyles.container}>
      <MainWrapper
        whiteBackground
        scrollEnabled={false}
        overrideContainerStyle={themedStyles.mainContainer}
      >
        <Header
          showBackButton={false}
          whiteColor
          leadingComponent={
            <View style={themedStyles.leadingContainer}>
              <BackButton whiteColor />
              <CustomText
                text={t("court.openMatch")}
                font="title"
                weight="semiBold"
              />
            </View>
          }
          trailingComponent={
            // Filters for open matches do not exist yet; the two icons did
            // nothing when tapped.
            <View style={themedStyles.actionContainer} />
          }
          overrideStyle={{
            justifyContent: "space-between",
          }}
        />

        <View style={themedStyles.content}>
          <CustomText
            text={t("openMatch.description")}
            font="headline2"
            weight="bold"
          />
          <CustomText
            text={t("openMatch.subtitle")}
            font="chip"
            weight="medium"
            overrideStyle={themedStyles.description}
          />
        </View>

        <List
          data={bookingsData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          emptyConfig={{
            image: Images.emptyBooking,
            title: t("activity.noBookings"),
            subtitle: t("openMatch.noMatchesSubtitle"),
            buttonTitle: t("openMatch.startMatch"),
            onButtonPress: onStartMatchPress,
          }}
          isLoading={isFetching}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.GREEN}
              colors={[colors.GREEN]}
            />
          }
          contentContainerStyle={themedStyles.listContainer}
          ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
        />
      </MainWrapper>
      <Chip
        onPress={onStartMatchPress}
        title={t("openMatch.startMatch")}
        isSelected
        overrideStyle={themedStyles.startMatchContainer}
        leftComponent={
          <View style={themedStyles.plusContainer}>
            <Image source={Images.plus} style={themedStyles.plusIcon} />
          </View>
        }
      />
    </View>
  );
};

export default OpenMatchScreen;
