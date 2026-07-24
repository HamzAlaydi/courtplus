import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Header, Tabs } from "molecules/index";
import { BookingHistory, CurrentBookings, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import { Images } from "theme";
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
    <MainWrapper
      whiteBackground
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header
        showBackButton={false}
        leadingComponent={
          <View style={themedStyles.leadingComponent}>
            <View style={themedStyles.layersContainer}>
              <Image source={Images.layers} style={themedStyles.layersIcon} />
            </View>
            <CustomText
              text={t("tabs.activity")}
              font="title"
              weight="semiBold"
            />
          </View>
        }
        trailingComponent={
          <View style={themedStyles.layersContainer}>
            <Image source={Images.bell} />
          </View>
        }
        overrideStyle={themedStyles.header}
      />
      <Tabs
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        overrideStyle={themedStyles.tabs}
        tabStyle={themedStyles.tab}
      />
      <View style={themedStyles.tabsContent}>
        {selectedTab.key === "current" && <CurrentBookings />}
        {selectedTab.key === "history" && <BookingHistory />}
      </View>
    </MainWrapper>
  );
};

export default ActivityScreen;
