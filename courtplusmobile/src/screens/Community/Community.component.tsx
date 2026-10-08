import { Input } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, UserFollowRow } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import styles from "./Community.styles";
import { useCommunity } from "./Community.logic";
import { User } from "models";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { enterDrop, useListEntering } from "utils";

const CommunityScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const entering = useListEntering();
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

  const renderItem = ({ item, index }: ListRenderItemInfo<User>) => {
    return (
      <Animated.View entering={entering(index)}>
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
      </Animated.View>
    );
  };

  return (
    <MainWrapper overrideContainerStyle={themedStyles.communityContent}>
      <Header
        showBackButton={false}
        title={t("tabs.community")}
        trailingComponent={
          <View style={themedStyles.iconContainer}>
            <Image source={Images.bell} style={themedStyles.bellIcon} />
          </View>
        }
      />
      <View style={themedStyles.content}>
        <Animated.View entering={enterDrop(0)}>
          <Input
            placeholder={t("community.search")}
            leftComponent={
              <Image source={Images.search} style={themedStyles.searchIcon} />
            }
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
          />
        </Animated.View>

        <List
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.INK}
              colors={[colors.INK]}
            />
          }
          data={communityData}
          isLoading={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          overrideContainerStyle={themedStyles.list}
          overrideLoaderContainerStyle={themedStyles.loader}
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
