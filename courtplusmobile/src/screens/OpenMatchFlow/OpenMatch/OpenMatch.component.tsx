import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, OpenMatchItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { enterDrop, enterRise, useListEntering, verticalScale } from "utils";
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
  const { bottom } = useSafeAreaInsets();
  const entering = useListEntering();

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

  const renderItem = ({ item, index }: ListRenderItemInfo<Booking>) => {
    const isMyBooking = item.participants.find(
      (participant) => participant.userId === profileId && participant.isCreator
    );
    return (
      <Animated.View entering={entering(index)}>
        <OpenMatchItem
          showBookNowButton={!isMyBooking}
          booking={item}
          onBookNowPress={() => handleBookNow(item)}
        />
      </Animated.View>
    );
  };

  return (
    <View style={themedStyles.container}>
      <MainWrapper
        scrollEnabled={false}
        overrideContainerStyle={themedStyles.mainContainer}
      >
        <Header whiteColor title={t("court.openMatch")} />

        <Animated.View entering={enterDrop(0)} style={themedStyles.intro}>
          <View style={themedStyles.introIconContainer}>
            <Image source={Images.community} style={themedStyles.introIcon} />
          </View>
          <View style={themedStyles.introText}>
            <CustomText
              text={t("openMatch.description")}
              font="sectionTitle"
              weight="bold"
              overrideStyle={themedStyles.introTitle}
            />
            <CustomText
              text={t("openMatch.subtitle")}
              font="caption"
              weight="regular"
              overrideStyle={themedStyles.description}
            />
          </View>
        </Animated.View>

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
          overrideLoaderContainerStyle={themedStyles.loader}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.INK}
              colors={[colors.INK]}
            />
          }
          contentContainerStyle={themedStyles.listContainer}
          ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
        />
      </MainWrapper>
      <Animated.View
        entering={enterRise(2)}
        pointerEvents="box-none"
        style={[
          themedStyles.startMatchContainer,
          { bottom: bottom + verticalScale(20) },
        ]}
      >
        <CustomButton
          onPress={onStartMatchPress}
          title={t("openMatch.startMatch")}
          variant="primary"
          overrideStyle={themedStyles.startMatchButton}
          leftIcon={
            <View style={themedStyles.plusContainer}>
              <Image source={Images.plus} style={themedStyles.plusIcon} />
            </View>
          }
        />
      </Animated.View>
    </View>
  );
};

export default OpenMatchScreen;
