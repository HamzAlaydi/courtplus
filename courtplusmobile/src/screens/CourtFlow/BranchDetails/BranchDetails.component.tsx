import { useNavigation } from "@react-navigation/native";
import { CourtStackNavigationProp } from "navigation/types";
import { BranchHeader, BranchTabs } from "organisms/index";
import React, { Fragment, useMemo } from "react";
import { Image, ScrollView, View } from "react-native";
import FocusAwareStatusBar from "atoms/FocusAwareStatusBar/FocusAwareStatusBar.component";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBranchDetails } from "./BranchDetails.logic";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./BranchDetails.styles";
import { convertMinutesToHours, enterRise, verticalScale } from "utils";
import { CustomText, SkeletonLoader } from "atoms/index";
import { Images } from "theme";

const BranchDetailsScreen = () => {
  const { data, isLoading, tabs } = useBranchDetails();
  const { t } = useTranslation();
  const { navigate } = useNavigation<CourtStackNavigationProp>();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top, bottom } = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View
        style={[
          themedStyles.loadingContainer,
          { paddingTop: top + verticalScale(16) },
        ]}
      >
        <SkeletonLoader />
      </View>
    );
  }

  const stats = [
    {
      key: "hours",
      value: `${convertMinutesToHours(data?.minutesBooked ?? 0)}`,
      label: t("branchDetails.hoursTotal"),
    },
    {
      key: "likes",
      value: `${data?.bookmarksCount ?? 0}`,
      label: t("settings.likes"),
    },
    {
      key: "sessions",
      value: `${data?.totalBookings ?? 0}`,
      label: t("branchDetails.sessions"),
    },
    {
      key: "minTime",
      value: "30",
      unit: t("general.mins"),
      label: t("branchDetails.minTime"),
    },
  ];

  return (
    <View style={themedStyles.container}>
      <FocusAwareStatusBar barStyle="light-content" />
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          themedStyles.contentContainer,
          { paddingBottom: bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BranchHeader
          coverUrl={data?.coverUrl ?? ""}
          imageUrl={data?.logoUrl ?? ""}
          isBookmarked={data?.isBookmarked ?? false}
          branchId={data?.id ?? ""}
        />
        <View style={themedStyles.content}>
          <Animated.View
            entering={enterRise(0)}
            style={themedStyles.titleBlock}
          >
            <CustomText
              text={data?.name ?? ""}
              font="screenTitle"
              weight="extraBold"
              uppercase={false}
              numberOfLines={2}
              accessibilityRole="header"
              overrideStyle={themedStyles.title}
            />
            {!!data?.location?.address && (
              <View style={themedStyles.metaRow}>
                <Image
                  source={Images.location}
                  style={themedStyles.locationIcon}
                />
                <CustomText
                  text={data.location.address}
                  font="caption"
                  weight="regular"
                  numberOfLines={2}
                  overrideStyle={themedStyles.addressText}
                />
              </View>
            )}
            <View style={themedStyles.metaRow}>
              <Image source={Images.star} style={themedStyles.starIcon} />
              <CustomText
                text={Number(data?.avgRating ?? 0).toFixed(1)}
                font="headline3"
                weight="semiBold"
                overrideStyle={themedStyles.ratingText}
              />
              <CustomText
                text={`· ${t("branchDetails.reviewsDesc", {
                  reviews: data?.reviewsCount ?? 0,
                })}`}
                font="caption"
                weight="regular"
                numberOfLines={1}
                overrideStyle={themedStyles.reviewsText}
              />
            </View>
          </Animated.View>

          <Animated.View entering={enterRise(1)} style={themedStyles.stats}>
            {stats.map((stat, index) => (
              <Fragment key={stat.key}>
                {index > 0 && <View style={themedStyles.statDivider} />}
                <View style={themedStyles.stat}>
                  <View style={themedStyles.statValueRow}>
                    <CustomText
                      text={stat.value}
                      font="displayNumber"
                      weight="bold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      overrideStyle={themedStyles.statValue}
                    />
                    {!!stat.unit && (
                      <CustomText
                        text={stat.unit}
                        font="caption"
                        weight="medium"
                        numberOfLines={1}
                        overrideStyle={themedStyles.statUnit}
                      />
                    )}
                  </View>
                  <CustomText
                    text={stat.label}
                    font="caption"
                    weight="regular"
                    numberOfLines={2}
                    overrideStyle={themedStyles.statLabel}
                  />
                </View>
              </Fragment>
            ))}
          </Animated.View>
        </View>
        <BranchTabs
          tabs={tabs}
          courts={data?.courts ?? []}
          onCourtPress={(court) => navigate("CourtDetails", { id: court.id })}
        />
      </ScrollView>
    </View>
  );
};

export default BranchDetailsScreen;
