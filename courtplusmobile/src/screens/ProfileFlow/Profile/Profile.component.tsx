import { BackButton, CustomText, SkeletonLoader } from "atoms/index";
import { useThemeContext } from "contexts";
import {
  ContextActionMenu,
  Header,
  ReportModal,
  ReportSubmittedModal,
  SessionOverview,
  SportBadge,
  Tabs,
} from "molecules/index";
import { MainWrapper, Posts, ProfileImageHeader } from "organisms/index";
import React, { useCallback, useMemo, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Images } from "theme";
import styles from "./Profile.styles";
import { generateFullName, Item } from "utils";
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
  const tabs = useMemo(
    () => [
      {
        key: "moments",
        title: !isVisitingProfile
          ? `${profile?.firstName ?? 0} ${t("court.moments")}`
          : t("profile.moments"),
      },
    ],
    [profile, isVisitingProfile]
  );
  const [selectedTab, setSelectedTab] = useState<Item>(tabs[0]);

  const renderLeadingComponent = useCallback(() => {
    if (!id)
      return (
        <View style={themedStyles.leadingComponent}>
          <View>
            <Image source={Images.profile} />
          </View>
          <CustomText
            text={t("profile.myProfile")}
            font="title"
            weight="semiBold"
          />
        </View>
      );
    return (
      <View style={themedStyles.leadingComponent}>
        <BackButton whiteColor />
        <CustomText
          text={generateFullName(profile ?? { firstName: "", lastName: "" })}
          font="title"
          weight="semiBold"
        />
      </View>
    );
  }, [profile, isVisitingProfile]);

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
      whiteBackground
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header
        showBackButton={false}
        leadingComponent={renderLeadingComponent()}
        trailingComponent={
          <TouchableOpacity onPress={onDotPress}>
            <Image source={Images.dot} />
          </TouchableOpacity>
        }
        overrideStyle={themedStyles.header}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <>
            <ProfileImageHeader
              user={profile || null}
              isVisitingOtherProfile={!isVisitingProfile}
              overrideStyle={themedStyles.profileImageHeader}
            />
            <View style={themedStyles.content}>
              <CustomText
                font="headline1"
                weight="semiBold"
                text={generateFullName(
                  profile ?? { firstName: "", lastName: "" }
                )}
                overrideStyle={themedStyles.name}
              />
              {profile?.username && (
                <CustomText
                  font="headline3"
                  weight="semiBold"
                  text={`@${profile?.username}`}
                  overrideStyle={themedStyles.username}
                />
              )}
              {profile?.bio && (
                <CustomText
                  font="chip"
                  weight="medium"
                  overrideStyle={themedStyles.description}
                  text={profile.bio}
                />
              )}
              <View style={themedStyles.sports}>
                {profile?.sports?.map((sport) => (
                  <SportBadge key={sport.id} sport={sport} />
                ))}
              </View>
              <SessionOverview
                overrideContainerStyle={themedStyles.sessions}
                sessions={sessions}
              />
            </View>
            <Tabs
              tabs={tabs}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              overrideStyle={themedStyles.tabs}
            />
            <View style={themedStyles.tabsContainer}>
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
