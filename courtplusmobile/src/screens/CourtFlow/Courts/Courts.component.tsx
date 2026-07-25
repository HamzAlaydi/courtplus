import { useThemeContext } from "contexts";
import LocationHeader from "molecules/LocationHeader/LocationHeader.component";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo } from "react";
import styles from "./Courts.styles";
import {
  CourtItem,
  FilterLocationModal,
  SortModal,
  SportChips,
} from "molecules/index";
import { Image, RefreshControl, TouchableOpacity, View } from "react-native";
import { Input } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useCourts } from "./Courts.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";

const CourtsScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    courts,
    isLoading,
    isRefetching,
    location,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    setSelectedSports,
    onSearchFocus,
    onSortPress,
    sortModalRef,
    onCourtPress,
    bottomSheetModalRef,
    onNotificationPress,
    onSelectSort,
    sortItem,
    onClearSort,
    onFilterPress,
  } = useCourts();

  const renderCourtItem = useCallback(({ item }: ListRenderItemInfo<Court>) => {
    return <CourtItem onPress={() => onCourtPress(item)} item={item} />;
  }, []);

  return (
    <MainWrapper
      enableSafeArea
      whiteBackground
      disableBottomPadding
      overrideContentStyle={themedStyles.container}
    >
      <LocationHeader
        currentLocation={location?.address ?? ""}
        onPress={() => bottomSheetModalRef.current?.present()}
        onNotificationPress={onNotificationPress}
        overrideStyle={themedStyles.locationHeader}
      />
      <View style={themedStyles.filtersSection}>
        <Input
          onFocus={onSearchFocus}
          placeholder={t("court.searchCourt")}
          leftComponent={<Image source={Images.search} />}
          overrideStyle={themedStyles.searchContainer}
        />
        <TouchableOpacity
          onPress={onSortPress}
          style={[themedStyles.filterContainer, themedStyles.sortContainer]}
        >
          <Image source={Images.sort} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onFilterPress}
          style={themedStyles.filterContainer}
        >
          <Image source={Images.filter} />
        </TouchableOpacity>
      </View>
      <SportChips
        multipleSelection
        onSportPress={setSelectedSports}
        overrideStyle={themedStyles.sportChips}
      />
      <List
        isLoading={isLoading}
        data={courts}
        renderItem={renderCourtItem}
        ItemSeparatorComponent={() => (
          <View style={themedStyles.courtSeparator} />
        )}
        contentContainerStyle={themedStyles.courtsList}
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
      />
      <FilterLocationModal ref={bottomSheetModalRef} />
      <SortModal
        ref={sortModalRef}
        onClear={() => onClearSort()}
        onSelectSort={onSelectSort}
        sortItem={sortItem}
      />
    </MainWrapper>
  );
};

export default CourtsScreen;
