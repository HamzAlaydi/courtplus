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

  const renderCourtItem = ({ item }: ListRenderItemInfo<Court>) => {
    return <CourtItem item={item} onPress={() => onCourtPress(item)} />;
  };
  return (
    <MainWrapper whiteBackground overrideContentStyle={themedStyles.content}>
      <Header
        whiteColor
        title={t("openMatch.chooseCourt")}
        overrideStyle={themedStyles.header}
      />
      <LocationHeader
        showNotification={false}
        currentLocation={location?.address ?? ""}
        onPress={() => bottomSheetModalRef.current?.present()}
        onNotificationPress={() => {}}
        overrideStyle={themedStyles.locationHeader}
        isLoading={isLoading}
      />
      <View style={themedStyles.resultsContainer}>
        <CustomText
          text={t("general.results", { count: courts.length })}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.resultsText}
        />
      </View>
      <List
        isLoading={isLoading}
        data={courts}
        renderItem={renderCourtItem}
        contentContainerStyle={themedStyles.contentList}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        ItemSeparatorComponent={() => <View style={{ marginTop: 17.36 }} />}
      />
    </MainWrapper>
  );
};

export default ChooseCourtScreen;
