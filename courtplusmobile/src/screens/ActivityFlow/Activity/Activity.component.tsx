import { useThemeContext } from "contexts";
import { Header, Tabs } from "molecules/index";
import { BookingHistory, CurrentBookings, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterDrop } from "utils";
import styles from "./Activity.styles";

import { useActivity } from "./Activity.logic";

const ActivityScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { selectedTab, setSelectedTab, tabs } = useActivity();

  return (
    <MainWrapper overrideContentStyle={themedStyles.scrollContent}>
      <Header
        showBackButton={false}
        title={t("tabs.activity")}
        trailingComponent={
          <View style={themedStyles.bellContainer}>
            <Image source={Images.bell} style={themedStyles.bellIcon} />
          </View>
        }
        overrideStyle={themedStyles.header}
      />
      <Animated.View entering={enterDrop(0)}>
        <Tabs
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          overrideStyle={themedStyles.tabs}
          tabStyle={themedStyles.tab}
        />
      </Animated.View>
      <View style={themedStyles.tabsContent}>
        {selectedTab.key === "current" && <CurrentBookings />}
        {selectedTab.key === "history" && <BookingHistory />}
      </View>
    </MainWrapper>
  );
};

export default ActivityScreen;
