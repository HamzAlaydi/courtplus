import { Header, NotificationItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "./Notifications.logic";
import { RefreshControl, View } from "react-native";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Notification } from "models";
import { useThemeContext } from "contexts";
import styles from "./Notifications.styles";
import { Images } from "theme";

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

  const renderItem = ({ item }: ListRenderItemInfo<Notification>) => {
    return <NotificationItem item={item} />;
  };
  return (
    <MainWrapper
      overrideContainerStyle={themedStyles.container}
      scrollEnabled={false}
      whiteBackground
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
        data={notificationsData}
        renderItem={renderItem}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.GREEN}
            colors={[colors.GREEN]}
          />
        }
        contentContainerStyle={themedStyles.listContainer}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </MainWrapper>
  );
};

export default NotificationsScreen;
