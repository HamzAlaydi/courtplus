import { ListRenderItemInfo } from "@shopify/flash-list";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { MatchEvent } from "models";
import { Header } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, RefreshControl, StyleSheet, View } from "react-native";
import { ColorsType, Images } from "theme";
import { formatTime, spacing, verticalScale } from "utils";
import styles from "./ActivityLog.styles";
import { getEventDescription, useActivityLog } from "./ActivityLog.logic";

// Kept in this file rather than ActivityLog.styles.ts so the shared sheet
// stays theme-free; the row needs the current palette for its muted text.
const itemStyles = (colors: ColorsType) =>
  StyleSheet.create({
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[6],
    },
    avatar: {
      width: spacing[32],
      height: spacing[32],
      borderRadius: spacing[50],
    },
    details: {
      flex: 1,
    },
    timestamp: {
      color: colors.GRAYISH_BLUE,
    },
    separator: {
      marginTop: verticalScale(22),
    },
    listContent: {
      paddingBottom: verticalScale(20),
    },
  });

const ActivityLogScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => itemStyles(colors), [colors]);
  const {
    eventsData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityLog();

  const renderItem = ({ item }: ListRenderItemInfo<MatchEvent>) => (
    <View style={themedStyles.item}>
      <Image
        source={
          item.user?.avatarUrl
            ? { uri: item.user.avatarUrl }
            : Images.maleProfile
        }
        style={themedStyles.avatar}
      />
      <View style={themedStyles.details}>
        <CustomText
          text={getEventDescription(item)}
          font="chip"
          weight="medium"
        />
        <CustomText
          text={formatTime(item.createdAt)}
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.timestamp}
        />
      </View>
    </View>
  );

  return (
    <MainWrapper whiteBackground scrollEnabled={false}>
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
            tintColor={colors.GREEN}
            colors={[colors.GREEN]}
          />
        }
        overrideContainerStyle={styles.container}
        contentContainerStyle={themedStyles.listContent}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </MainWrapper>
  );
};

export default ActivityLogScreen;
