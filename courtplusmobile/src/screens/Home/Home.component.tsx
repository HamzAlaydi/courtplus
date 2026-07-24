import { CustomText, Input } from "atoms/index";
import { useThemeContext } from "contexts";
import { FilterLocationModal, HomeCourt, SportChips } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useCallback, useMemo, useRef } from "react";
import { Image, ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./Home.styles";
import LocationHeader from "molecules/LocationHeader/LocationHeader.component";
import Card from "atoms/Card/Card.component";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useHome } from "./Home.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Court } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const {
    courts,
    location,
    isLoading,
    setSelectedSports,
    onSearchFocus,
    actionCards,
  } = useHome();
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const onCourtsPress = () => {
    navigate("MainTabs", { screen: "Courts" });
  };

  const onCourtPress = (id: string) => {
    navigate("CourtStack", { screen: "CourtDetails", params: { id } });
  };

  const renderCourtItem = useCallback(({ item }: ListRenderItemInfo<Court>) => {
    return <HomeCourt item={item} onPress={() => onCourtPress(item.id)} />;
  }, []);

  const onNotificationPress = () => {
    navigate("Notifications");
  };

  return (
    <MainWrapper
      scrollEnabled
      enableSafeArea
      overrideContainerStyle={themedStyles.container}
      overrideContentStyle={themedStyles.content}
    >
      <LocationHeader
        currentLocation={location?.address ?? ""}
        onPress={() => bottomSheetModalRef.current?.present()}
        onNotificationPress={onNotificationPress}
        overrideStyle={themedStyles.locationHeader}
        isLoading={isLoading}
      />
      <Input
        onFocus={onSearchFocus}
        overrideStyle={themedStyles.input}
        placeholder={t("court.findCourts")}
        leftComponent={<Image source={Images.search} />}
      />
      <View style={themedStyles.courtsSection}>
        <CustomText
          text={t("tabs.courts")}
          font="headline2"
          weight="semiBold"
          overrideStyle={themedStyles.courtsTitle}
        />
        <CustomText
          text={t("general.seeAll")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.seeAll}
          onPress={onCourtsPress}
        />
      </View>
      <SportChips
        multipleSelection
        onSportPress={setSelectedSports}
        overrideStyle={themedStyles.sportChips}
      />
      <List
        isLoading={isLoading}
        data={courts}
        horizontal
        renderItem={renderCourtItem}
        contentContainerStyle={themedStyles.courtScrollView}
        ItemSeparatorComponent={() => (
          <View style={themedStyles.courtSeparator} />
        )}
        showsHorizontalScrollIndicator={false}
      />

      <View style={themedStyles.bottomContainer}>
        <CustomText
          font="headline2"
          weight="semiBold"
          overrideStyle={themedStyles.courtsTitle}
          text={t("court.playMatch")}
        />
        <View style={themedStyles.actionCardsRow}>
          {actionCards.map((item) => (
            <Card
              onPress={item.onPress}
              key={item.title}
              overrideStyle={themedStyles.actionCard}
            >
              <ImageBackground
                source={item.imageBg}
                style={themedStyles.actionCardImage}
                imageStyle={themedStyles.actionCardImageBg}
              >
                <View style={themedStyles.actionCardImageContainer}>
                  <Image source={item.image} />
                  <CustomText
                    font="headline3"
                    weight="bold"
                    overrideStyle={themedStyles.actionCardTitle}
                    text={item.title}
                  />
                </View>
              </ImageBackground>
              <CustomText
                font="text"
                weight="medium"
                overrideStyle={themedStyles.actionCardDescription}
                text={item.description}
              />
            </Card>
          ))}
        </View>
      </View>
      <FilterLocationModal ref={bottomSheetModalRef} />
    </MainWrapper>
  );
};

export default HomeScreen;
