import { CustomText, Input, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import { CourtItem, Header, SportChips, Tabs } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo } from "react";
import styles from "./Search.styles";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { Image, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSearch } from "./Search.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { enterRise } from "utils";

/** Results visible on first paint rise in; later ones mount without motion. */
const ANIMATED_RESULTS = 4;

const SearchScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    tabs,
    setSelectedTab,
    selectedTab,
    setSelectedSports,
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    setSearchInput,
    searchInput,
    onNotificationPress,
    onCourtPress,
  } = useSearch();

  const renderCourtItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Court>) => (
      <Animated.View
        entering={index < ANIMATED_RESULTS ? enterRise(index) : undefined}
      >
        <CourtItem
          onPress={() => onCourtPress(item)}
          item={item}
          ctaTitle={t("openMatch.bookNow")}
        />
      </Animated.View>
    ),
    [t]
  );

  return (
    <MainWrapper
      disableBottomPadding
      overrideContentStyle={themedStyles.container}
    >
      <Header
        whiteColor
        title={t("general.search")}
        overrideStyle={themedStyles.header}
        trailingComponent={
          <PressableScale
            style={themedStyles.notifications}
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={t("notifications.title")}
          >
            <Image source={Images.bell} style={themedStyles.bellIcon} />
          </PressableScale>
        }
      />
      <Input
        value={searchInput}
        onChangeText={setSearchInput}
        overrideStyle={themedStyles.input}
        placeholder={t("court.findCourts")}
        accessibilityLabel={t("general.search")}
        leftComponent={
          <Image source={Images.search} style={themedStyles.searchIcon} />
        }
      />
      {tabs.length > 1 && (
        <Tabs
          tabs={tabs}
          setSelectedTab={setSelectedTab}
          selectedTab={selectedTab}
          overrideStyle={themedStyles.tabs}
        />
      )}
      <View style={themedStyles.sectionHeader}>
        <CustomText
          text={selectedTab.title}
          font="sectionTitle"
          weight="bold"
          accessibilityRole="header"
          overrideStyle={themedStyles.sectionTitle}
        />
        {!isLoading && !!searchInput && (
          <CustomText
            text={t("general.results", { count: data?.length })}
            font="caption"
            weight="medium"
            numberOfLines={1}
            overrideStyle={themedStyles.results}
          />
        )}
      </View>

      <SportChips
        multipleSelection
        onSportPress={setSelectedSports}
        overrideStyle={themedStyles.sportChips}
      />
      {searchInput && (
        <List
          data={data}
          renderItem={renderCourtItem}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
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
          emptyConfig={{
            image: Images.emptyBooking,
            title: t("community.noResults"),
            subtitle: t("community.noResultsSubtitle"),
          }}
        />
      )}
    </MainWrapper>
  );
};

export default SearchScreen;
