import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  ActivityScreen,
  CommunityScreen,
  CourtsScreen,
  HomeScreen,
  ProfileScreen,
} from "screens";
import { MainTabsParamList } from "./types";
import { CustomText } from "atoms/index";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import CourtFilledIcon from "assets/images/svg/courtFilled";
import CourtIcon from "assets/images/svg/court";
import styles from "./navigation.styles";
import HomeFilled from "assets/images/svg/homeFilled";
import HomeIcon from "assets/images/svg/home";
import ProfileFilledIcon from "assets/images/svg/profileFilled";
import ProfileIcon from "assets/images/svg/profile";
import CommunityFilledIcon from "assets/images/svg/communityFilled";
import CommunityIcon from "assets/images/svg/community";
import ActivityFilledIcon from "assets/images/svg/activityFilled";
import ActivityIcon from "assets/images/svg/activity";

const MainTabsNavigator = createBottomTabNavigator<MainTabsParamList>();

const MainTabs = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const tabs = [
    {
      name: "Courts" as keyof MainTabsParamList,
      component: CourtsScreen,
      icon: CourtIcon,
      focusedIcon: CourtFilledIcon,
      label: t("tabs.courts"),
    },
    {
      name: "Community" as keyof MainTabsParamList,
      component: CommunityScreen,
      icon: CommunityIcon,
      focusedIcon: CommunityFilledIcon,
      label: t("tabs.community"),
    },
    {
      name: "Home" as keyof MainTabsParamList,
      component: HomeScreen,
      icon: HomeIcon,
      focusedIcon: HomeFilled,
      label: t("tabs.home"),
    },
    {
      name: "Activity" as keyof MainTabsParamList,
      component: ActivityScreen,
      icon: ActivityIcon,
      focusedIcon: ActivityFilledIcon,
      label: t("tabs.activity"),
    },
    {
      name: "Profile" as keyof MainTabsParamList,
      component: ProfileScreen,
      icon: ProfileIcon,
      focusedIcon: ProfileFilledIcon,
      label: t("tabs.profile"),
    },
  ];

  return (
    <MainTabsNavigator.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Home"
    >
      {tabs.map((tab) => (
        <MainTabsNavigator.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarIcon: ({ focused }) =>
              focused ? <tab.focusedIcon /> : <tab.icon />,
            tabBarLabel: ({ focused }) => (
              <CustomText
                numberOfLines={1}
                text={tab.label}
                font="text"
                weight="semiBold"
                overrideStyle={[
                  focused
                    ? themedStyles.tabBarLabelActive
                    : themedStyles.tabBarLabel,
                  themedStyles.tabBar,
                ]}
              />
            ),
          }}
        />
      ))}
    </MainTabsNavigator.Navigator>
  );
};

export default MainTabs;
