import { CourtItem, Header } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useChooseCourt } from "./ChooseCourt.logic";
import LocationHeader from "molecules/LocationHeader/LocationHeader.component";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { useThemeContext } from "contexts";
import styles from "./ChooseCourt.styles";
import { CustomText } from "atoms/index";
import Animated from "react-native-reanimated";
import { enterDrop, useListEntering } from "utils";

const ChooseCourtScreen = () => {
  const { t } = useTranslation();
  const {
    location,
    bottomSheetModalRef,
    isLoading,
    courts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onCourtPress,
  } = useChooseCourt();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const entering = useListEntering();

  const renderCourtItem = ({ item, index }: ListRenderItemInfo<Court>) => {
    return (
      <Animated.View entering={entering(index)}>
        <CourtItem item={item} onPress={() => onCourtPress(item)} />
      </Animated.View>
    );
  };
  return (
    <MainWrapper overrideContentStyle={themedStyles.content}>
      <Header
        whiteColor
        title={t("openMatch.chooseCourt")}
        overrideStyle={themedStyles.header}
      />
      <Animated.View entering={enterDrop(0)}>
        <LocationHeader
          showNotification={false}
          currentLocation={location?.address ?? ""}
          onPress={() => bottomSheetModalRef.current?.present()}
          onNotificationPress={() => {}}
          overrideStyle={themedStyles.locationHeader}
          isLoading={isLoading}
        />
      </Animated.View>
      <View style={themedStyles.resultsContainer}>
        <CustomText
          text={t("general.results", { count: courts.length })}
          font="caption"
          weight="medium"
          overrideStyle={themedStyles.resultsText}
        />
      </View>
      <List
        isLoading={isLoading}
        data={courts}
        renderItem={renderCourtItem}
        contentContainerStyle={themedStyles.contentList}
        overrideLoaderContainerStyle={themedStyles.loader}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
      />
    </MainWrapper>
  );
};

export default ChooseCourtScreen;
