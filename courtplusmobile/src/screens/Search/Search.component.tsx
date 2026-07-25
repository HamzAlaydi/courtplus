import { CustomText, Input } from "atoms/index";
import { useThemeContext } from "contexts";
import { CourtItem, Header, SportChips, Tabs } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo } from "react";
import styles from "./Search.styles";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { Image, RefreshControl, TouchableOpacity, View } from "react-native";
import { useSearch } from "./Search.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";

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

  const renderCourtItem = useCallback(({ item }: ListRenderItemInfo<Court>) => {
    return <CourtItem onPress={() => onCourtPress(item)} item={item} />;
  }, []);

  return (
    <MainWrapper
      whiteBackground
      disableBottomPadding
      overrideContentStyle={themedStyles.container}
    >
      <Header
        whiteColor
        overrideStyle={themedStyles.header}
        trailingComponent={
          <TouchableOpacity
            style={themedStyles.notifications}
            onPress={onNotificationPress}
          >
            <Image source={Images.bell} />
          </TouchableOpacity>
        }
      />
      <Input
        value={searchInput}
        onChangeText={setSearchInput}
        overrideStyle={themedStyles.input}
        placeholder={t("court.findCourts")}
        leftComponent={<Image source={Images.search} />}
      />
      <Tabs
        tabs={tabs}
        setSelectedTab={setSelectedTab}
        selectedTab={selectedTab}
        overrideStyle={themedStyles.tabs}
      />

      <SportChips
        multipleSelection
        onSportPress={setSelectedSports}
        overrideStyle={themedStyles.sportChips}
      />
      {!isLoading && searchInput && (
        <CustomText
          text={t("general.results", { count: data?.length })}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.results}
        />
      )}
      {searchInput && (
        <List
          data={data}
          renderItem={renderCourtItem}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
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
