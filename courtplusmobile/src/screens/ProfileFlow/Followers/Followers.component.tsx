import React from "react";
import { Header, UserFollowRow } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import { useFollowers } from "./Followers.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { FriendShip } from "models";
import styles from "./Followers.styles";
import { RefreshControl, View } from "react-native";
import { Images } from "theme";
import { useTranslation } from "react-i18next";

const FollowersScreen = () => {
  const {
    headerTitle,
    friendshipsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefreshing,
    onRefresh,
    onUserPress,
    onFollow,
    onUnfollow,
    profileId,
  } = useFollowers();
  const { t } = useTranslation();

  const renderItem = ({ item }: ListRenderItemInfo<FriendShip>) => {
    return (
      <UserFollowRow
        name={item.user.firstName}
        username={item.user.username}
        image={item.user.avatarUrl ?? ""}
        gender={item.user.gender}
        isFollowing={item.user.isFollowing ?? false}
        isFollowed={item.user.isFollowed ?? false}
        onFollow={() => onFollow(item.user.id)}
        onUnfollow={() => onUnfollow(item.user.id)}
        onPress={() => onUserPress(item.user.id)}
        showButton={profileId !== item.user.id}
      />
    );
  };
  return (
    <MainWrapper scrollEnabled={false} whiteBackground>
      <Header whiteColor title={headerTitle} />
      <List
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        isLoading={isLoading}
        data={friendshipsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        emptyConfig={{
          image: Images.emptyBooking,
          title: t("profile.noFollowers"),
          subtitle: t("profile.noFollowersSubtitle"),
        }}
      />
    </MainWrapper>
  );
};

export default FollowersScreen;
