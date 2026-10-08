import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TabsProps } from "./Tabs.types";
import styles from "./Tabs.styles";
import { useThemeContext } from "contexts";
import { CustomText, PressableScale } from "atoms/index";
import { ColorsType } from "theme";
import { STATE_TIMING } from "utils";

type TabItemProps = {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  colors: ColorsType;
  themedStyles: ReturnType<typeof styles>;
  tabStyle?: StyleProp<ViewStyle>;
};

const TabItem = ({
  title,
  isSelected,
  onPress,
  colors,
  themedStyles,
  tabStyle,
}: TabItemProps) => {
  const progress = useSharedValue(isSelected ? 1 : 0);
  const idleColor = colors.CARD;
  const activeColor = colors.INK;

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, STATE_TIMING);
  }, [isSelected, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [idleColor, activeColor]
    ),
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      style={[themedStyles.tab, tabStyle]}
    >
      <Animated.View style={[themedStyles.tabBackground, animatedStyle]} />
      <CustomText
        text={title}
        font="headline3"
        weight={isSelected ? "semiBold" : "medium"}
        numberOfLines={1}
        overrideStyle={[
          themedStyles.title,
          isSelected && themedStyles.selectedTitle,
        ]}
      />
    </PressableScale>
  );
};

const Tabs = ({
  tabs,
  setSelectedTab,
  selectedTab,
  overrideStyle,
  tabStyle,
}: TabsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [contentWidth, setContentWidth] = useState(0);
  const { width } = useWindowDimensions();

  const onContentSizeChange = (width: number) => {
    setContentWidth(width);
  };

  const isScrollable = contentWidth > width;

  return (
    <View style={[themedStyles.wrapper, overrideStyle]}>
      <ScrollView
        scrollEnabled={isScrollable}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={themedStyles.scroll}
        contentContainerStyle={themedStyles.contentContainer}
        onContentSizeChange={onContentSizeChange}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            title={tab.title}
            isSelected={selectedTab.key === tab.key}
            onPress={() => setSelectedTab(tab)}
            colors={colors}
            themedStyles={themedStyles}
            tabStyle={tabStyle}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default Tabs;
