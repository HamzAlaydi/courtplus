import { Header, NotificationItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "./Notifications.logic";
import { RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Notification } from "models";
import { useThemeContext } from "contexts";
import styles from "./Notifications.styles";
import { Images } from "theme";
import { enterRise } from "utils";

/** Rows visible on first paint rise in; later pages mount without motion. */
const ANIMATED_ROWS = 8;

const NotificationsScreen = () => {
  const { t } = useTranslation();
  const {
    notificationsData,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotifications();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const renderItem = ({ item, index }: ListRenderItemInfo<Notification>) => {
    return (
      <Animated.View
        entering={index < ANIMATED_ROWS ? enterRise(index) : undefined}
      >
        <NotificationItem item={item} />
      </Animated.View>
    );
  };
  return (
    <MainWrapper
      overrideContainerStyle={themedStyles.container}
      scrollEnabled={false}
    >
      <Header whiteColor title={t("notifications.title")} />
      <List
        emptyConfig={{
          image: Images.notificationBell,
          overrideImageStyle: themedStyles.emptyImage,
          title: t("notifications.empty"),
          subtitle: t("notifications.emptySubtitle"),
        }}
        isLoading={isLoading}
        overrideLoaderContainerStyle={themedStyles.loader}
        data={notificationsData}
        renderItem={renderItem}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.INK}
            colors={[colors.INK]}
          />
        }
        contentContainerStyle={themedStyles.listContainer}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </MainWrapper>
  );
};

export default NotificationsScreen;
