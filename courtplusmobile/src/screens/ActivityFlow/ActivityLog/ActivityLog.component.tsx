import { ListRenderItemInfo } from "@shopify/flash-list";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { MatchEvent } from "models";
import { Header } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { formatTime, useListEntering } from "utils";
import styles from "./ActivityLog.styles";
import { getEventDescription, useActivityLog } from "./ActivityLog.logic";

const ActivityLogScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const entering = useListEntering();
  const {
    eventsData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityLog();

  const renderItem = ({ item, index }: ListRenderItemInfo<MatchEvent>) => {
    const isLast = index === (eventsData?.length ?? 0) - 1;
    return (
      <Animated.View entering={entering(index)} style={themedStyles.item}>
        <View style={themedStyles.timeline}>
          <Image
            source={
              item.user?.avatarUrl
                ? { uri: item.user.avatarUrl }
                : Images.maleProfile
            }
            style={themedStyles.avatar}
          />
          {!isLast && <View style={themedStyles.timelineLine} />}
        </View>
        <View style={themedStyles.details}>
          <CustomText
            text={getEventDescription(item)}
            font="headline3"
            weight="medium"
          />
          <CustomText
            text={formatTime(item.createdAt)}
            font="caption"
            weight="regular"
            overrideStyle={themedStyles.timestamp}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <MainWrapper scrollEnabled={false}>
      <Header whiteColor title={t("activity.activityLog")} />
      <List
        data={eventsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        emptyConfig={{
          image: Images.notificationBell,
          title: t("activity.noActivity"),
          subtitle: t("activity.noActivitySubtitle"),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.INK}
            colors={[colors.INK]}
          />
        }
        overrideContainerStyle={themedStyles.container}
        overrideLoaderContainerStyle={themedStyles.loader}
        contentContainerStyle={themedStyles.listContent}
      />
    </MainWrapper>
  );
};

export default ActivityLogScreen;
