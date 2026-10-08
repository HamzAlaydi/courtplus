import { CustomText, PressableScale, SkeletonLoader } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  ContextActionMenu,
  Header,
  ReportModal,
  ReportSubmittedModal,
  SportBadge,
} from "molecules/index";
import { MainWrapper, Posts, ProfileImageHeader } from "organisms/index";
import React, { useMemo } from "react";
import { Image, RefreshControl, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import styles from "./Profile.styles";
import { enterDrop, enterRise, generateFullName } from "utils";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useProfile } from "./Profile.logic";

const ProfileScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const {
    profile,
    isLoading,
    sessions,
    flattenPostsData,
    isPostsLoading,
    isFetchingNextPostsPage,
    hasNextPostsPage,
    fetchNextPostsPage,
    id,
    isVisitingProfile,
    onRefresh,
    isRefreshing,
    isContextActionMenuVisible,
    onContextActionMenuClose,
    onContextActionMenuPress,
    contextActionMenuItems,
    reportModalRef,
    onReportClose,
    reportSubmittedModalRef,
  } = useProfile();

  const fullName = generateFullName(profile ?? { firstName: "", lastName: "" });

  const momentsTitle = useMemo(
    () =>
      !isVisitingProfile
        ? `${profile?.firstName ?? 0} ${t("court.moments")}`
        : t("profile.moments"),
    [profile, isVisitingProfile]
  );

  const sessionStats = useMemo(
    () =>
      sessions.map((session) => ({
        value: session.title,
        label: session.subtitle,
      })),
    [sessions]
  );

  const onDotPress = () => {
    if (!isVisitingProfile) {
      onContextActionMenuPress();
      return;
    }
    navigate("ProfileStack", { screen: "Settings" });
  };

  return (
    <MainWrapper
      scrollEnabled={false}
      overrideContentStyle={themedStyles.wrapperContent}
    >
      <Header
        showBackButton={!!id}
        whiteColor
        title={!id ? t("profile.myProfile") : fullName}
        trailingComponent={
          <PressableScale
            onPress={onDotPress}
            hitSlop={4}
            accessibilityRole="button"
            style={themedStyles.moreButton}
          >
            <Image
              source={isVisitingProfile ? Images.settings : Images.dot}
              style={
                isVisitingProfile
                  ? themedStyles.settingsIcon
                  : themedStyles.moreIcon
              }
            />
          </PressableScale>
        }
        overrideStyle={themedStyles.header}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={themedStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.INK}
            colors={[colors.INK]}
          />
        }
      >
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <Animated.View entering={enterDrop(0)}>
              <ProfileImageHeader
                user={profile || null}
                isVisitingOtherProfile={!isVisitingProfile}
                overrideStyle={themedStyles.profileImageHeader}
                stats={sessionStats}
              >
                <View style={themedStyles.identity}>
                  <CustomText
                    font="displayHero"
                    weight="bold"
                    text={fullName}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    accessibilityRole="header"
                  />
                  {profile?.username && (
                    <CustomText
                      font="headline3"
                      weight="medium"
                      text={`@${profile?.username}`}
                      overrideStyle={themedStyles.username}
                    />
                  )}
                  {profile?.bio && (
                    <CustomText
                      font="headline3"
                      weight="regular"
                      overrideStyle={themedStyles.description}
                      text={profile.bio}
                    />
                  )}
                </View>
              </ProfileImageHeader>
            </Animated.View>
            {!!profile?.sports?.length && (
              <Animated.View
                entering={enterRise(1)}
                style={themedStyles.sports}
              >
                {profile.sports.map((sport) => (
                  <SportBadge key={sport.id} sport={sport} />
                ))}
              </Animated.View>
            )}
            <Animated.View
              entering={enterRise(2)}
              style={themedStyles.momentsHeader}
            >
              <CustomText
                text={momentsTitle}
                font="sectionTitle"
                weight="bold"
                accessibilityRole="header"
              />
            </Animated.View>
            <View style={themedStyles.postsContainer}>
              <Posts
                postsData={flattenPostsData}
                isLoading={isPostsLoading}
                isFetchingNextPage={isFetchingNextPostsPage}
                hasNextPage={hasNextPostsPage}
                fetchNextPage={fetchNextPostsPage}
              />
            </View>
          </>
        )}
      </ScrollView>
      <ContextActionMenu
        isVisible={isContextActionMenuVisible}
        onClose={onContextActionMenuClose}
        items={contextActionMenuItems}
      />
      <ReportModal
        ref={reportModalRef}
        entityId={id ?? ""}
        entity="user"
        onClose={onReportClose}
      />
      <ReportSubmittedModal ref={reportSubmittedModalRef} />
    </MainWrapper>
  );
};

export default ProfileScreen;
