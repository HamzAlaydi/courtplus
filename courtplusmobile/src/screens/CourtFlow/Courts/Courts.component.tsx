import { useThemeContext } from "contexts";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo } from "react";
import styles from "./Courts.styles";
import {
  CourtItem,
  FilterLocationModal,
  SortModal,
  SportChips,
} from "molecules/index";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { Chip, CustomText, PressableScale } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useCourts } from "./Courts.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { ListProps } from "organisms/List/List.types";
import {
  enterFade,
  exitFade,
  formatDate,
  sports,
  useListEntering,
} from "utils";

type ActiveFilter = {
  key: string;
  label: string;
  icon: ImageSourcePropType;
  isRating?: boolean;
  onRemove: () => void;
};

type CourtsListProps = Omit<ListProps<Court>, "renderItem"> & {
  onCourtPress: (court: Court) => void;
  ctaTitle: string;
};

/**
 * Mounted again whenever loading finishes so the cards rise in once per
 * result set, not while scrolling or paginating.
 */
const CourtsList = ({ onCourtPress, ctaTitle, ...props }: CourtsListProps) => {
  const entering = useListEntering();

  const renderCourtItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Court>) => (
      <Animated.View entering={entering(index)}>
        <CourtItem
          onPress={() => onCourtPress(item)}
          item={item}
          ctaTitle={ctaTitle}
        />
      </Animated.View>
    ),
    [ctaTitle, entering, onCourtPress]
  );

  return <List {...props} renderItem={renderCourtItem} />;
};

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
    filters,
    filterSports,
    activeFiltersCount,
    onRemoveSportFilter,
    onRemoveFilter,
  } = useCourts();

  const getActiveFilters = () => {
    const items: ActiveFilter[] = filterSports.map((value) => {
      const sport = sports.find((item) => item.value === value);
      return {
        key: `sport-${value}`,
        label: sport?.label ?? value,
        icon: Images[(sport?.icon ?? "court") as keyof typeof Images],
        onRemove: () => onRemoveSportFilter(value),
      };
    });
    if (filters?.minRating) {
      items.push({
        key: "minRating",
        // Same label rule as the filter sheet's rating chips.
        label:
          filters.minRating < 5
            ? `${filters.minRating}+`
            : `${filters.minRating}`,
        icon: Images.star,
        isRating: true,
        onRemove: () => onRemoveFilter("minRating"),
      });
    }
    if (filters?.startAt) {
      const startAt = new Date(filters.startAt.replace(" ", "T")).toString();
      items.push({
        key: "startAt",
        label: `${formatDate(startAt, "EEE d MMM")} · ${formatDate(
          startAt,
          "h:mm a"
        )}`,
        icon: Images.calendar,
        onRemove: () => onRemoveFilter("startAt"),
      });
    }
    if (filters?.isAirConditioned) {
      items.push({
        key: "isAirConditioned",
        label: t("court.airConditioned"),
        icon: Images.airConditioner,
        onRemove: () => onRemoveFilter("isAirConditioned"),
      });
    }
    if (filters?.isWomenOnly) {
      items.push({
        key: "isWomenOnly",
        label: t("court.womenOnly"),
        icon: Images.womenOnly,
        onRemove: () => onRemoveFilter("isWomenOnly"),
      });
    }
    return items;
  };
  const activeFilters = getActiveFilters();

  const courtsCount = courts?.length ?? 0;
  const resultsCountLabel = t("general.results", { count: courtsCount });
  const resultsLabel = hasNextPage
    ? resultsCountLabel.replace(`${courtsCount}`, `${courtsCount}+`)
    : resultsCountLabel;
  const sortLabel = sortItem
    ? `${t("filters.sort")}: ${sortItem.title}`
    : t("filters.sort");

  return (
    <MainWrapper
      enableSafeArea
      disableBottomPadding
      overrideContentStyle={themedStyles.container}
    >
      <View style={themedStyles.header}>
        <View style={themedStyles.titleRow}>
          <View style={themedStyles.titleColumn}>
            <CustomText
              text={t("general.courts")}
              font="screenTitle"
              weight="extraBold"
              numberOfLines={1}
              accessibilityRole="header"
            />
            {location?.address ? (
              <PressableScale
                onPress={() => bottomSheetModalRef.current?.present()}
                style={themedStyles.locationRow}
                scaleTo={0.98}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`${t("general.location")}: ${
                  location.address
                }`}
              >
                <Image
                  source={Images.location}
                  style={themedStyles.locationIcon}
                />
                <CustomText
                  text={location.address}
                  font="caption"
                  weight="medium"
                  numberOfLines={1}
                  overrideStyle={themedStyles.locationText}
                />
                <Image
                  source={Images.arrowDown}
                  style={themedStyles.locationChevron}
                />
              </PressableScale>
            ) : (
              <ActivityIndicator
                size="small"
                color={colors.MUTED}
                style={themedStyles.locationLoader}
              />
            )}
          </View>
          <PressableScale
            onPress={onNotificationPress}
            style={themedStyles.roundButton}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t("settings.notifications")}
          >
            <Image source={Images.bell} style={themedStyles.roundButtonIcon} />
          </PressableScale>
        </View>

        <View style={themedStyles.searchRow}>
          <PressableScale
            onPress={onSearchFocus}
            style={themedStyles.searchField}
            scaleTo={0.98}
            accessibilityRole="search"
            accessibilityLabel={t("court.searchCourt")}
          >
            <Image source={Images.search} style={themedStyles.searchIcon} />
            <CustomText
              text={t("court.searchCourt")}
              font="headline3"
              weight="medium"
              numberOfLines={1}
              overrideStyle={themedStyles.searchPlaceholder}
            />
          </PressableScale>
          <PressableScale
            onPress={onFilterPress}
            style={themedStyles.filterButton}
            accessibilityRole="button"
            accessibilityLabel={
              activeFiltersCount > 0
                ? `${t("filters.title")} (${activeFiltersCount})`
                : t("filters.title")
            }
          >
            <Image source={Images.filter} style={themedStyles.filterIcon} />
            {activeFiltersCount > 0 && (
              <Animated.View
                entering={enterFade()}
                exiting={exitFade()}
                style={themedStyles.filterBadge}
              >
                <CustomText
                  text={`${activeFiltersCount}`}
                  font="tabLabel"
                  weight="semiBold"
                  overrideStyle={themedStyles.filterBadgeText}
                />
              </Animated.View>
            )}
          </PressableScale>
        </View>
      </View>

      <SportChips
        multipleSelection
        onSportPress={setSelectedSports}
        overrideStyle={themedStyles.sportChips}
      />

      {activeFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={themedStyles.activeFiltersScroll}
          contentContainerStyle={themedStyles.activeFilters}
        >
          {activeFilters.map((filter, index) => (
            <Animated.View
              key={filter.key}
              entering={enterFade(index)}
              exiting={exitFade()}
            >
              <Chip
                title={filter.label}
                isSelected={false}
                variant="feature"
                onPress={onFilterPress}
                overrideStyle={themedStyles.activeFilterChip}
                leftComponent={
                  <Image
                    source={filter.icon}
                    style={[
                      themedStyles.activeFilterIcon,
                      filter.isRating && themedStyles.activeFilterStar,
                    ]}
                  />
                }
                rightComponent={
                  <PressableScale
                    onPress={filter.onRemove}
                    hitSlop={10}
                    style={themedStyles.removeFilterButton}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("general.clear")} ${filter.label}`}
                  >
                    <Image
                      source={Images.close}
                      style={themedStyles.removeFilterIcon}
                    />
                  </PressableScale>
                }
              />
            </Animated.View>
          ))}
        </ScrollView>
      )}

      <View style={themedStyles.resultsRow}>
        <CustomText
          text={isLoading ? "" : resultsLabel}
          font="caption"
          weight="regular"
          numberOfLines={1}
          overrideStyle={themedStyles.resultsText}
        />
        <PressableScale
          onPress={onSortPress}
          style={themedStyles.sortButton}
          scaleTo={0.97}
          hitSlop={6}
          accessibilityRole="button"
        >
          <CustomText
            text={sortLabel}
            font="caption"
            weight="semiBold"
            numberOfLines={1}
            overrideStyle={themedStyles.sortText}
          />
          <Image source={Images.arrowDown} style={themedStyles.sortChevron} />
        </PressableScale>
      </View>

      <CourtsList
        key={isLoading ? "loading" : "ready"}
        isLoading={isLoading}
        data={courts}
        onCourtPress={onCourtPress}
        ctaTitle={t("openMatch.bookNow")}
        ItemSeparatorComponent={() => (
          <View style={themedStyles.courtSeparator} />
        )}
        contentContainerStyle={themedStyles.courtsList}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        emptyConfig={{
          image: Images.emptyBooking,
          title: t("court.noCourts"),
          subtitle: t("court.noCourtsSubtitle"),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.INK}
            colors={[colors.INK]}
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
