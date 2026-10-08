import {
  BackButton,
  CustomButton,
  CustomText,
  PressableScale,
  SkeletonLoader,
} from "atoms/index";
import { useThemeContext } from "contexts";
import { EmptyState, Header } from "molecules/index";
import { CourtTabs, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, ImageSourcePropType, RefreshControl, View } from "react-native";
import FocusAwareStatusBar from "atoms/FocusAwareStatusBar/FocusAwareStatusBar.component";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import styles from "./CourtDetails.styles";
import { Images } from "theme";
import { useCourtDetails } from "./CourtDetails.logic";
import { CourtStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import {
  enterFade,
  enterRise,
  getCourtImage,
  mapSportItem,
  openInMaps,
  verticalScale,
} from "utils";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";

type FeatureChipItem = {
  key: string;
  title: string;
  icon: ImageSourcePropType;
  highlight?: boolean;
};

const capitalize = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const CourtDetailsScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();
  const {
    onBookCourtPress,
    isLoading,
    isRefetching,
    refetch,
    data,
    courtSport,
    onBookmarkPress,
    onReviewPress,
  } = useCourtDetails();
  const { navigate } = useNavigation<CourtStackNavigationProp>();

  const onBranchDetailsPress = () => {
    navigate("BranchDetails", { id: data?.branch?.id ?? "" });
  };

  const courtLocation = data?.branch?.location ?? data?.location;

  const onLocationPress = async () => {
    const opened = await openInMaps(courtLocation);
    if (!opened) {
      showSnackbar({ message: t("court.locationUnavailable") });
    }
  };

  const bottomBarPadding =
    bottom > 0 ? bottom + verticalScale(4) : verticalScale(16);

  const features: FeatureChipItem[] = useMemo(() => {
    if (!data) {
      return [];
    }
    const sport = mapSportItem(courtSport);
    const items: FeatureChipItem[] = [
      { key: "sport", title: sport.name, icon: Images[sport.icon] },
    ];
    if (data.surface) {
      items.push({
        key: "surface",
        title: t(`court.surfaces.${data.surface}`, {
          defaultValue: capitalize(data.surface),
        }),
        icon: Images.court,
      });
    }
    if (data.isAirConditioned) {
      items.push({
        key: "airConditioned",
        title: t("court.airConditioned"),
        icon: Images.airConditioner,
        highlight: true,
      });
    }
    if (data.isWomenOnly) {
      items.push({
        key: "womenOnly",
        title: t("court.womenOnly"),
        icon: Images.womenOnly,
        highlight: true,
      });
    }
    return items;
  }, [data, courtSport, t]);

  const renderHeroControls = (showBookmark: boolean) => (
    <View
      pointerEvents="box-none"
      style={[themedStyles.heroControls, { top: top + verticalScale(8) }]}
    >
      <BackButton whiteColor overrideStyle={themedStyles.glassButton} />
      {showBookmark && (
        <PressableScale
          onPress={onBookmarkPress}
          style={themedStyles.glassButton}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t("general.save")}
          accessibilityState={{ selected: !!data?.isBookmarked }}
        >
          <Image
            source={data?.isBookmarked ? Images.bookmark2 : Images.bookmark}
            style={themedStyles.glassIcon}
          />
        </PressableScale>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.hero} />
        <View style={[themedStyles.sheet, themedStyles.skeletonSheet]}>
          <SkeletonLoader overrideContainerStyle={themedStyles.skeleton} />
        </View>
        {renderHeroControls(false)}
      </View>
    );
  }

  // Suspended / unpublished / deleted court (404): render a message instead
  // of crashing on `data!!`.
  if (!data) {
    return (
      <MainWrapper>
        <Header whiteColor title={t("court.courtDetails")} />
        <EmptyState
          image={Images.court}
          title={t("court.notAvailable")}
          overrideImageStyle={themedStyles.unavailableImage}
        />
      </MainWrapper>
    );
  }

  const reviewsText = `· ${data.reviewsCount ?? 0} ${t("court.reviews")}`;

  return (
    <View style={themedStyles.container}>
      <FocusAwareStatusBar barStyle="light-content" />
      <MainWrapper
        scrollEnabled
        whiteBackground
        disableBottomPadding
        overrideContentStyle={[
          themedStyles.scrollContent,
          { paddingBottom: bottomBarPadding + verticalScale(96) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.INK}
            colors={[colors.INK]}
          />
        }
      >
        <View style={themedStyles.hero}>
          <Animated.Image
            entering={enterFade()}
            source={getCourtImage(data)}
            style={themedStyles.heroImage}
            accessibilityIgnoresInvertColors
          />
        </View>

        <View style={themedStyles.sheet}>
          <Animated.View
            entering={enterRise(0)}
            style={themedStyles.titleBlock}
          >
            <CustomText
              text={data.name || ""}
              font="screenTitle"
              weight="extraBold"
              uppercase={false}
              accessibilityRole="header"
              numberOfLines={2}
              overrideStyle={themedStyles.title}
            />
            <View style={themedStyles.metaRow}>
              {!!data.branch?.name && (
                <PressableScale
                  onPress={onBranchDetailsPress}
                  style={themedStyles.metaItem}
                  hitSlop={8}
                  accessibilityRole="link"
                >
                  <Image
                    source={Images.location}
                    style={themedStyles.metaIcon}
                  />
                  <CustomText
                    text={data.branch.name}
                    font="caption"
                    weight="medium"
                    numberOfLines={1}
                    overrideStyle={themedStyles.metaText}
                  />
                </PressableScale>
              )}
              <PressableScale
                onPress={onReviewPress}
                style={themedStyles.metaItem}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Image source={Images.star} style={themedStyles.starIcon} />
                <CustomText
                  text={Number(data.avgRating ?? 0).toFixed(1)}
                  font="caption"
                  weight="semiBold"
                  overrideStyle={themedStyles.ratingText}
                />
                <CustomText
                  text={reviewsText}
                  font="caption"
                  weight="regular"
                  overrideStyle={themedStyles.metaText}
                />
              </PressableScale>
            </View>
          </Animated.View>

          {features.length > 0 && (
            <Animated.View
              entering={enterRise(1)}
              style={themedStyles.chipsRow}
            >
              {features.map((feature) => (
                <View
                  key={feature.key}
                  style={[
                    themedStyles.featureChip,
                    feature.highlight && themedStyles.featureChipHighlight,
                  ]}
                >
                  <Image
                    source={feature.icon}
                    style={[
                      themedStyles.featureChipIcon,
                      feature.highlight &&
                        themedStyles.featureChipIconHighlight,
                    ]}
                  />
                  <CustomText
                    text={feature.title}
                    font="caption"
                    weight="semiBold"
                    overrideStyle={[
                      themedStyles.featureChipText,
                      feature.highlight &&
                        themedStyles.featureChipTextHighlight,
                    ]}
                  />
                </View>
              ))}
            </Animated.View>
          )}

          {!!data.description && (
            <Animated.View entering={enterRise(2)}>
              <CustomText
                font="headline3"
                weight="regular"
                overrideStyle={themedStyles.description}
                text={data.description}
              />
            </Animated.View>
          )}

          <Animated.View entering={enterRise(3)}>
            <PressableScale
              style={themedStyles.locationCard}
              onPress={onLocationPress}
              scaleTo={0.98}
              accessibilityRole="button"
              accessibilityLabel={t("court.openInMaps")}
            >
              <View style={themedStyles.locationIconTile}>
                <Image
                  source={Images.outlinedLocation}
                  style={themedStyles.locationIcon}
                />
              </View>
              <View style={themedStyles.locationTextColumn}>
                <CustomText
                  text={courtLocation?.address || t("general.location")}
                  font="headline3"
                  weight="semiBold"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  overrideStyle={themedStyles.locationTitle}
                />
                <CustomText
                  text={t("court.openInMaps")}
                  font="caption"
                  weight="regular"
                  numberOfLines={1}
                  overrideStyle={themedStyles.mutedText}
                />
              </View>
              <Image source={Images.arrowLeft} style={themedStyles.chevron} />
            </PressableScale>
          </Animated.View>
        </View>

        <CourtTabs court={data} />
      </MainWrapper>

      {renderHeroControls(true)}

      <View
        style={[themedStyles.bottomBar, { paddingBottom: bottomBarPadding }]}
      >
        <View style={themedStyles.priceColumn}>
          <CustomText
            text={t("court.rate")}
            font="caption"
            weight="regular"
            numberOfLines={1}
            overrideStyle={themedStyles.mutedText}
          />
          <View style={themedStyles.priceRow}>
            <CustomText
              text={`${data.hourlyRate ?? 0}`}
              font="displayNumber"
              weight="extraBold"
              overrideStyle={themedStyles.price}
            />
            <CustomText
              text={data.currency ?? t("general.currency")}
              font="caption"
              weight="medium"
              overrideStyle={themedStyles.mutedText}
            />
          </View>
        </View>
        <CustomButton
          variant="primary"
          onPress={onBookCourtPress}
          title={t("court.bookCourt")}
          overrideStyle={themedStyles.bookButton}
        />
      </View>
    </View>
  );
};

export default CourtDetailsScreen;
