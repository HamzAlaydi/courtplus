import { CourtItem, Tabs } from "molecules/index";
import React, { useMemo, useState } from "react";
import { BranchTabsProps } from "./BranchTabs.types";
import { useThemeContext } from "contexts";
import styles from "./BranchTabs.styles";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import List from "organisms/List/List.component";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { CustomText } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useListEntering } from "utils";

const BranchTabs = ({
  tabs,
  overrideStyle,
  courts,
  onCourtPress,
}: BranchTabsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const { t } = useTranslation();
  const entering = useListEntering();

  const courtsData =
    courts?.filter((court) => court.sport === selectedTab?.key) ?? [];

  const renderItem = ({ item, index }: ListRenderItemInfo<Court>) => {
    return (
      <Animated.View entering={entering(index)}>
        <CourtItem
          showBottomInfo={false}
          item={item}
          onPress={() => onCourtPress?.(item)}
          ctaTitle={t("openMatch.bookNow")}
        />
      </Animated.View>
    );
  };

  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.header}>
        <View style={themedStyles.iconContainer}>
          <Image source={Images.court} style={themedStyles.icon} />
        </View>
        <CustomText
          text={t("branchDetails.courtsAvailable")}
          font="sectionTitle"
          weight="bold"
          numberOfLines={1}
          accessibilityRole="header"
          overrideStyle={themedStyles.title}
        />
        {courts.length > 0 && (
          <View style={themedStyles.countBadge}>
            <CustomText
              text={`${courts.length}`}
              font="caption"
              weight="semiBold"
              overrideStyle={themedStyles.countText}
            />
          </View>
        )}
      </View>
      {tabs.length > 0 && (
        <Tabs
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          overrideStyle={themedStyles.tabs}
        />
      )}
      <List
        data={courtsData}
        renderItem={renderItem}
        contentContainerStyle={themedStyles.contentContainer}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </View>
  );
};

export default BranchTabs;
