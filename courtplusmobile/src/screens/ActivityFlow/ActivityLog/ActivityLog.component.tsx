import { ActivityLogItem, Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { View } from "react-native";
import styles from "./ActivityLog.styles";
import { useActivityLog } from "./ActivityLog.logic";

const ActivityLogScreen = () => {
  const {
    eventsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityLog();
  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title="Activity Log" />
      <View style={styles.container}>
        <ActivityLogItem />
      </View>
    </MainWrapper>
  );
};

export default ActivityLogScreen;
