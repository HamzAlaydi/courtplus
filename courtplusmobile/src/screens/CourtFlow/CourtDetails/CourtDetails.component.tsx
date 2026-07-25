import { Chip, CustomButton, CustomText, SkeletonLoader } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, SportBadge, StarDisplay } from "molecules/index";
import { CourtTabs, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, TouchableOpacity, View } from "react-native";
import styles from "./CourtDetails.styles";
import { Images } from "theme";
import { useCourtDetails } from "./CourtDetails.logic";
import { CourtStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";

const CourtDetailsScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
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

  if (isLoading) {
    return (
      <MainWrapper whiteBackground>
        <View style={themedStyles.infoContainer}>
          <Header whiteColor title={t("court.courtDetails")} />
          <SkeletonLoader />
        </View>
      </MainWrapper>
    );
  }

  return (
    <View style={themedStyles.container}>
      <MainWrapper
        scrollEnabled
        overrideContentStyle={themedStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.GREEN}
            colors={[colors.GREEN]}
          />
        }
      >
        <View style={[themedStyles.mainContent, themedStyles.infoContainer]}>
          <Header whiteColor title={t("court.courtDetails")} />
          <View style={themedStyles.content}>
            <View style={themedStyles.detailsContainer}>
              <View>
                <CustomText
                  font="title"
                  weight="semiBold"
                  text={data?.name || ""}
                />
                <CustomText
                  text={data?.branch?.name || ""}
                  font="headline3"
                  weight="regular"
                  overrideStyle={themedStyles.branchName}
                  onPress={onBranchDetailsPress}
                />
              </View>
              <TouchableOpacity
                onPress={onBookmarkPress}
                style={themedStyles.bookmarkContainer}
              >
                <Image
                  source={
                    !data?.isBookmarked ? Images.bookmark : Images.bookmark2
                  }
                  style={data?.isBookmarked && themedStyles.bookmarkIcon}
                />
              </TouchableOpacity>
            </View>
            {data?.description && (
              <CustomText
                font="headline3"
                weight="regular"
                overrideStyle={themedStyles.description}
                text={data.description}
              />
            )}
            <View style={themedStyles.reviewsContainer}>
              <StarDisplay rating={data?.avgRating || 0} />
              <CustomButton
                variant="link"
                title={`${data?.reviewsCount} ${t("court.reviews")}`}
                onPress={onReviewPress}
              />
            </View>
            <View style={themedStyles.locationMainContainer}>
              <SportBadge
                sport={courtSport}
                overrideStyle={themedStyles.widgetWrapper}
              />
              <View style={themedStyles.locationContainer}>
                <Image source={Images.outlinedLocation} />
                <CustomText
                  text={data?.branch?.location?.address || ""}
                  font="chip"
                  weight="medium"
                  overrideStyle={themedStyles.locationText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                />
              </View>
            </View>
          </View>
        </View>

        <CourtTabs court={data!!} />
      </MainWrapper>
      <Chip
        isSelected
        onPress={onBookCourtPress}
        title={t("court.bookCourt")}
        overrideTextStyle={themedStyles.chipText}
        overrideStyle={themedStyles.chipContainer}
        leftComponent={
          <View style={themedStyles.calendarContainer}>
            <Image source={Images.calendar} />
          </View>
        }
      />
    </View>
  );
};

export default CourtDetailsScreen;
