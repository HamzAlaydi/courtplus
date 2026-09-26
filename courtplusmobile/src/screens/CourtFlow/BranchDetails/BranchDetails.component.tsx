import { useNavigation } from "@react-navigation/native";
import { CourtStackNavigationProp } from "navigation/types";
import { BranchHeader, BranchTabs, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useBranchDetails } from "./BranchDetails.logic";
import { MetricRow, SessionOverview, StarDisplay, Tabs } from "molecules/index";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import styles from "./BranchDetails.styles";
import { convertMinutesToHours } from "utils";
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

  if (isLoading) {
    return (
      <View style={themedStyles.loadingContainer}>
        <SkeletonLoader />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        bounces={false}
        contentContainerStyle={themedStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <BranchHeader
          coverUrl={data?.coverUrl ?? ""}
          imageUrl={data?.logoUrl ?? ""}
          isBookmarked={data?.isBookmarked ?? false}
          branchId={data?.id ?? ""}
        />
        <View style={themedStyles.content}>
          <MetricRow
            overrideStyle={themedStyles.metrics}
            leftValue={`${convertMinutesToHours(data?.minutesBooked ?? 0)} ${t(
              "branchDetails.hoursTotal"
            )}`}
            rightValue={`${data?.bookmarksCount} ${t("settings.likes")}`}
          />

          <CustomText
            text={data?.name ?? ""}
            font="headline1"
            weight="semiBold"
            overrideStyle={themedStyles.title}
          />
          <View style={themedStyles.locationContainer}>
            <CustomText
              text={t("general.location")}
              overrideStyle={themedStyles.locationText}
              font="headline3"
              weight="bold"
            />
            <CustomText
              text={`@ ${data?.location.address ?? ""}`}
              font="headline3"
              weight="semiBold"
              overrideStyle={themedStyles.addressText}
            />
          </View>

          <View style={themedStyles.reviewsContainer}>
            <StarDisplay rating={data?.avgRating ?? 0} />
            <CustomText
              text={t("branchDetails.reviewsDesc", {
                reviews: data?.reviewsCount ?? 0,
              })}
              font="headline3"
              weight="semiBold"
              overrideStyle={themedStyles.addressText}
            />
          </View>
          <SessionOverview
            overrideContainerStyle={themedStyles.sessionOverviewContainer}
            overrideColumnStyle={themedStyles.sessionOverviewColumn}
            sessions={[
              {
                title: `30 ${t("general.mins")}`,
                image: Images.clock,
                subtitle: t("branchDetails.minTime"),
              },
              {
                title: `${data?.totalBookings}`,
                image: Images.clipboard,
                subtitle: t("branchDetails.sessions"),
              },
            ]}
          />
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
