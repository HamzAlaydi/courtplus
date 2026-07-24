import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { TabsProps } from "./Tabs.types";
import styles from "./Tabs.styles";
import { useThemeContext } from "contexts";
import { CustomText } from "atoms/index";

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
    <View style={overrideStyle}>
      <ScrollView
        scrollEnabled={isScrollable}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={themedStyles.contentContainer}
        onContentSizeChange={onContentSizeChange}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setSelectedTab(tab)}
            style={[
              selectedTab.key === tab.key && themedStyles.activeBorder,
              tabStyle,
            ]}
          >
            <CustomText
              text={tab.title}
              font="chip"
              weight={selectedTab.key === tab.key ? "semiBold" : "regular"}
              overrideStyle={[
                themedStyles.title,
                selectedTab.key === tab.key && themedStyles.selectedTitle,
              ]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Tabs;
