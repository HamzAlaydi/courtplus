import { CustomText, Input, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  CachedImage,
  FilterLocationModal,
  HomeCourt,
  SportChips,
} from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo, useRef } from "react";
import { Image, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SkeletonPlaceholder from "react-native-skeleton-placeholder";
import { Images, Radius } from "theme";
import styles, {
  COURT_CARD_WIDTH,
  COURT_GAP,
  COURT_IMAGE_HEIGHT,
} from "./Home.styles";
import LocationHeader from "molecules/LocationHeader/LocationHeader.component";
import FocusAwareStatusBar from "atoms/FocusAwareStatusBar/FocusAwareStatusBar.component";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useHome } from "./Home.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { enterRise, horizontalScale, isRTL, spacing } from "utils";
import {
  BookingsTileIcon,
  CoachTileIcon,
  CourtTileIcon,
  FilterIcon,
  OpenMatchTileIcon,
  SearchIcon,
} from "./Home.icons";
import { HomeQuickActionKey } from "./Home.types";

/** Cards visible on first paint fade in; later ones mount without motion. */
const ANIMATED_COURT_CARDS = 3;

const ARABIC_LETTER = /[؀-ۿ]/;

const quickActionIcons: Record<
  HomeQuickActionKey,
  (props: { color: string }) => React.JSX.Element
> = {
  courts: CourtTileIcon,
  bookings: BookingsTileIcon,
  openMatch: OpenMatchTileIcon,
  coaches: CoachTileIcon,
};

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.trim().charAt(0) ?? "";
  if (ARABIC_LETTER.test(first)) {
    return first;
  }
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`;
};

const HomeScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const {
    courts,
    location,
    profile,
    greeting,
    subtitle,
    isLoading,
    setSelectedSports,
    onSearchFocus,
    quickActions,
    onCourtsPress,
    onFilterPress,
    onCourtPress,
    onNotificationPress,
    onProfilePress,
    isRefetching,
    refetch,
  } = useHome();

  const renderCourtItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Court>) => (
      <Animated.View
        entering={index < ANIMATED_COURT_CARDS ? enterRise(index) : undefined}
      >
        <HomeCourt item={item} onPress={() => onCourtPress(item.id)} />
      </Animated.View>
    ),
    []
  );

  const initials = getInitials(profile?.firstName, profile?.lastName);

  const avatar = (
    <PressableScale
      onPress={onProfilePress}
      style={themedStyles.avatar}
      accessibilityRole="button"
      accessibilityLabel={t("tabs.profile")}
    >
      {profile?.avatarUrl ? (
        <CachedImage
          source={profile.avatarUrl}
          overrideStyle={themedStyles.avatarImage}
        />
      ) : initials ? (
        <CustomText
          text={initials}
          font="sectionTitle"
          weight="bold"
          overrideStyle={themedStyles.avatarInitials}
        />
      ) : (
        <Image source={Images.user} style={themedStyles.avatarIcon} />
      )}
    </PressableScale>
  );

  return (
    <View style={themedStyles.screen}>
      <FocusAwareStatusBar barStyle="light-content" />
      <View style={[themedStyles.statusBarBackdrop, { height: top }]} />
      <MainWrapper
        scrollEnabled
        disableBottomPadding
        overrideContentStyle={themedStyles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.INK}
            colors={[colors.INK]}
          />
        }
      >
        <View style={themedStyles.headerBand}>
          <LocationHeader
            variant="dark"
            currentLocation={location?.address ?? ""}
            onPress={() => bottomSheetModalRef.current?.present()}
            onNotificationPress={onNotificationPress}
            isLoading={isLoading}
            trailingComponent={avatar}
          />
          <View style={themedStyles.greeting}>
            <CustomText
              text={greeting}
              font="displayHero"
              weight="extraBold"
              numberOfLines={2}
              accessibilityRole="header"
              overrideStyle={themedStyles.greetingTitle}
            />
            <CustomText
              text={subtitle}
              font="headline3"
              weight="regular"
              overrideStyle={themedStyles.greetingSubtitle}
            />
          </View>
          <View style={themedStyles.searchRow}>
            <Input
              onFocus={onSearchFocus}
              overrideStyle={themedStyles.input}
              placeholder={t("court.findCourts")}
              accessibilityLabel={t("general.search")}
              leftComponent={<SearchIcon color={colors.MUTED} />}
            />
            <PressableScale
              onPress={onFilterPress}
              style={themedStyles.filterButton}
              accessibilityRole="button"
              accessibilityLabel={t("filters.title")}
            >
              <FilterIcon color={colors.INK} />
            </PressableScale>
          </View>
        </View>

        <View style={themedStyles.quickActions}>
          {quickActions.map((action, index) => {
            const Icon = quickActionIcons[action.key];
            return (
              <Animated.View
                key={action.key}
                entering={enterRise(index)}
                style={themedStyles.quickActionCell}
              >
                <PressableScale
                  onPress={action.onPress}
                  style={themedStyles.quickAction}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <View style={themedStyles.quickActionTile}>
                    <Icon color={colors.INK} />
                  </View>
                  <CustomText
                    text={action.title}
                    font="caption"
                    weight="medium"
                    numberOfLines={2}
                    overrideStyle={themedStyles.quickActionLabel}
                  />
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>

        <View style={themedStyles.sectionHeader}>
          <CustomText
            text={t("settings.nearbyCourts")}
            font="sectionTitle"
            weight="bold"
            accessibilityRole="header"
            overrideStyle={themedStyles.sectionTitle}
          />
          <PressableScale
            onPress={onCourtsPress}
            hitSlop={10}
            accessibilityRole="button"
          >
            <CustomText
              text={t("general.seeAll")}
              font="headline3"
              weight="semiBold"
              overrideStyle={themedStyles.seeAll}
            />
          </PressableScale>
        </View>
        <SportChips
          multipleSelection
          onSportPress={setSelectedSports}
          overrideStyle={themedStyles.sportChips}
        />
        {isLoading ? (
          <View style={themedStyles.skeletonRow}>
            <SkeletonPlaceholder
              speed={1100}
              direction={isRTL ? "left" : "right"}
              backgroundColor={colors.LINE}
              highlightColor={colors.SUBTLE}
            >
              <SkeletonPlaceholder.Item flexDirection="row" gap={COURT_GAP}>
                {[0, 1].map((key) => (
                  <SkeletonPlaceholder.Item key={key} width={COURT_CARD_WIDTH}>
                    <SkeletonPlaceholder.Item
                      height={COURT_IMAGE_HEIGHT}
                      borderRadius={Radius.card}
                    />
                    <SkeletonPlaceholder.Item
                      marginTop={spacing[12]}
                      width="70%"
                      height={horizontalScale(16)}
                      borderRadius={Radius.small}
                    />
                    <SkeletonPlaceholder.Item
                      marginTop={spacing[8]}
                      width="45%"
                      height={horizontalScale(12)}
                      borderRadius={Radius.small}
                    />
                  </SkeletonPlaceholder.Item>
                ))}
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
          </View>
        ) : (
          <List
            isLoading={false}
            data={courts}
            horizontal
            renderItem={renderCourtItem}
            contentContainerStyle={themedStyles.courtScrollView}
            ItemSeparatorComponent={() => (
              <View style={themedStyles.courtSeparator} />
            )}
            emptyConfig={{
              image: Images.emptyBooking,
              title: t("court.noCourts"),
              subtitle: t("court.noCourtsSubtitle"),
              overrideStyle: themedStyles.emptyState,
              overrideImageStyle: themedStyles.emptyImage,
            }}
            showsHorizontalScrollIndicator={false}
          />
        )}
        <FilterLocationModal ref={bottomSheetModalRef} />
      </MainWrapper>
    </View>
  );
};

export default HomeScreen;
