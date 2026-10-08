import React, { useEffect, useMemo } from "react";
import {
  BottomTabBarButtonProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { useNavigationState, useRoute } from "@react-navigation/native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SvgProps } from "react-native-svg";
import {
  ActivityScreen,
  CommunityScreen,
  CourtsScreen,
  HomeScreen,
  ProfileScreen,
} from "screens";
import { MainTabsParamList } from "./types";
import { CustomText, PressableScale } from "atoms/index";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import CourtFilledIcon from "assets/images/svg/courtFilled";
import CourtIcon from "assets/images/svg/court";
import styles, { TAB_BAR_CONTENT_HEIGHT } from "./navigation.styles";
import HomeFilled from "assets/images/svg/homeFilled";
import HomeIcon from "assets/images/svg/home";
import ProfileFilledIcon from "assets/images/svg/profileFilled";
import ProfileIcon from "assets/images/svg/profile";
import CommunityFilledIcon from "assets/images/svg/communityFilled";
import CommunityIcon from "assets/images/svg/community";
import ActivityFilledIcon from "assets/images/svg/activityFilled";
import ActivityIcon from "assets/images/svg/activity";
import { RateBookingPrompt } from "organisms/index";
import { TOGGLE_SPRING } from "utils";

const MainTabsNavigator = createBottomTabNavigator<MainTabsParamList>();

type TabIconProps = {
  /** Which of the two copies bottom-tabs renders (see TabIcon). */
  focused: boolean;
  Icon: React.ComponentType<SvgProps>;
  FocusedIcon: React.ComponentType<SvgProps>;
  themedStyles: ReturnType<typeof styles>;
};

const TabIcon = ({
  focused,
  Icon,
  FocusedIcon,
  themedStyles,
}: TabIconProps) => {
  // bottom-tabs renders every icon twice, a focused and an unfocused copy, and
  // swaps their opacity instantly, so `focused` never changes inside a copy.
  // The pill follows the navigator's own state instead, so it springs in or
  // out in whichever copy is visible.
  const route = useRoute();
  const isActive = useNavigationState(
    (state) => state.routes[state.index]?.key === route.key
  );
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, TOGGLE_SPRING);
  }, [isActive, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
    transform: [{ scaleX: 0.6 + 0.4 * progress.value }],
  }));

  return (
    <View style={themedStyles.iconWrapper}>
      <Animated.View style={[themedStyles.activePill, pillStyle]} />
      {focused ? <FocusedIcon /> : <Icon />}
    </View>
  );
};

const TabBarButton = ({
  href: _href,
  pressColor: _pressColor,
  pressOpacity: _pressOpacity,
  hoverEffect: _hoverEffect,
  android_ripple: _androidRipple,
  ref: _ref,
  style,
  children,
  onPress,
  ...rest
}: BottomTabBarButtonProps) => (
  <PressableScale {...rest} onPress={onPress} style={style}>
    {children}
  </PressableScale>
);

const renderTabBarButton = (props: BottomTabBarButtonProps) => (
  <TabBarButton {...props} />
);

const MainTabs = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  const tabs = [
    {
      name: "Courts" as keyof MainTabsParamList,
      component: CourtsScreen,
      icon: CourtIcon,
      focusedIcon: CourtFilledIcon,
      label: t("tabBar.courts"),
    },
    {
      name: "Community" as keyof MainTabsParamList,
      component: CommunityScreen,
      icon: CommunityIcon,
      focusedIcon: CommunityFilledIcon,
      label: t("tabBar.community"),
    },
    {
      name: "Home" as keyof MainTabsParamList,
      component: HomeScreen,
      icon: HomeIcon,
      focusedIcon: HomeFilled,
      label: t("tabBar.home"),
    },
    {
      name: "Activity" as keyof MainTabsParamList,
      component: ActivityScreen,
      icon: ActivityIcon,
      focusedIcon: ActivityFilledIcon,
      label: t("tabBar.activity"),
    },
    {
      name: "Profile" as keyof MainTabsParamList,
      component: ProfileScreen,
      icon: ProfileIcon,
      focusedIcon: ProfileFilledIcon,
      label: t("tabBar.profile"),
    },
  ];

  return (
    <>
      <MainTabsNavigator.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            themedStyles.tabBarStyle,
            { height: TAB_BAR_CONTENT_HEIGHT + bottom },
          ],
          tabBarItemStyle: themedStyles.tabBarItem,
          tabBarIconStyle: themedStyles.tabBarIcon,
          tabBarButton: renderTabBarButton,
          tabBarActiveTintColor: colors.INK,
          tabBarInactiveTintColor: colors.MUTED,
          sceneStyle: themedStyles.scene,
        }}
        initialRouteName="Home"
      >
        {tabs.map((tab) => (
          <MainTabsNavigator.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  focused={focused}
                  Icon={tab.icon}
                  FocusedIcon={tab.focusedIcon}
                  themedStyles={themedStyles}
                />
              ),
              tabBarLabel: ({ focused }) => (
                <CustomText
                  numberOfLines={1}
                  text={tab.label}
                  font="tabLabel"
                  weight={focused ? "semiBold" : "medium"}
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
      <RateBookingPrompt />
    </>
  );
};

export default MainTabs;
