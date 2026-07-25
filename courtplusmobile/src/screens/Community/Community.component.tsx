import { CustomText, Input } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, UserFollowRow } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, View } from "react-native";
import { Images } from "theme";
import styles from "./Community.styles";
import { useCommunity } from "./Community.logic";
import { User } from "models";
import { ListRenderItemInfo } from "@shopify/flash-list";

const CommunityScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const {
    searchInput,
    setSearchInput,
    communityData,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    onUserPress,
    onFollow,
    onUnfollow,
    onRefresh,
    refreshing,
  } = useCommunity();

  const renderItem = ({ item }: ListRenderItemInfo<User>) => {
    return (
      <UserFollowRow
        onFollow={() => onFollow(item.id)}
        onUnfollow={() => onUnfollow(item.id)}
        isFollowed={item.isFollowed ?? false}
        isFollowing={item.isFollowing ?? false}
        name={item.firstName}
        username={item.username}
        image={item.avatarUrl ?? ""}
        onPress={() => onUserPress(item.id)}
        gender={item.gender}
      />
    );
  };

  return (
    <MainWrapper
      overrideContainerStyle={themedStyles.communityContent}
      whiteBackground
    >
      <Header
        overrideStyle={themedStyles.headerMainContainer}
        showBackButton={false}
        leadingComponent={
          <View style={themedStyles.headerContainer}>
            <View style={themedStyles.iconContainer}>
              <Image source={Images.community} />
            </View>
            <CustomText
              text={t("tabs.community")}
              font="title"
              weight="semiBold"
            />
          </View>
        }
        trailingComponent={
          <View style={themedStyles.iconContainer}>
            <Image source={Images.bell} />
          </View>
        }
      />
      <View style={themedStyles.content}>
        <Input
          placeholder={t("community.search")}
          leftComponent={<Image source={Images.search} />}
          value={searchInput}
          onChangeText={setSearchInput}
        />

        <List
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={communityData}
          isLoading={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={themedStyles.listContainer}
          ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
          emptyConfig={{
            image: Images.emptyBooking,
            title: searchInput
              ? t("community.noResults")
              : t("community.noUsers"),
            subtitle: searchInput
              ? t("community.noResultsSubtitle")
              : t("community.noUsersSubtitle"),
          }}
        />
      </View>
    </MainWrapper>
  );
};

export default CommunityScreen;
