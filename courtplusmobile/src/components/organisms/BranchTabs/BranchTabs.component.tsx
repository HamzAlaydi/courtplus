import { CourtItem, Tabs } from "molecules/index";
import React, { useMemo, useState } from "react";
import { BranchTabsProps } from "./BranchTabs.types";
import { useThemeContext } from "contexts";
import styles from "./BranchTabs.styles";
import { Image, View } from "react-native";
import List from "organisms/List/List.component";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { CustomText } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";

const BranchTabs = ({ tabs, overrideStyle, courts }: BranchTabsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const { t } = useTranslation();

  const courtsData =
    courts?.filter((court) => court.sport === selectedTab?.key) ?? [];

  const renderItem = ({ item }: ListRenderItemInfo<Court>) => {
    return <CourtItem showBottomInfo={false} item={item} onPress={() => {}} />;
  };

  const renderSectionHeader = () => {
    return (
      <View style={themedStyles.header}>
        <View style={themedStyles.iconContainer}>
          <Image source={Images.court} style={themedStyles.icon} />
        </View>
        <CustomText
          text={t("branchDetails.courtsAvailable")}
          font="title"
          weight="semiBold"
        />
      </View>
    );
  };

  return (
    <View>
      <Tabs
        tabs={tabs}
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
        overrideStyle={[themedStyles.container, overrideStyle]}
      />
      <List
        ListHeaderComponent={renderSectionHeader}
        data={courtsData}
        renderItem={renderItem}
        contentContainerStyle={themedStyles.contentContainer}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </View>
  );
};

export default BranchTabs;
