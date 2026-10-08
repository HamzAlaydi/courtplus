import { useThemeContext } from "contexts";
import { BookmarkItem, Header } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Images } from "theme";
import styles from "./Saved.styles";
import { useTranslation } from "react-i18next";
import { useSaved } from "./Saved.logic";
import { Bookmark } from "models";
import { ImageSourcePropType, View } from "react-native";
import Animated from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { getCourtImage, useListEntering } from "utils";

const SavedScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const entering = useListEntering();
  const {
    savedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    onRemove,
  } = useSaved();

  const renderItem = ({ item, index }: { item: Bookmark; index: number }) => {
    const currentItem: {
      name: string;
      location: string;
      image: ImageSourcePropType;
    } =
      item.type === "court"
        ? {
            name: item.court?.name ?? "",
            location: item.court?.branch?.name ?? "",
            image: item.court ? getCourtImage(item.court) : Images.openMatch,
          }
        : {
            name: item.branch?.name ?? "",
            location:
              item.branch?.location?.name ??
              item.branch?.location?.address ??
              "",
            image: item.branch?.coverUrl
              ? { uri: item.branch.coverUrl }
              : Images.openMatch,
          };
    return (
      <Animated.View entering={entering(index)}>
        <BookmarkItem
          image={currentItem.image}
          title={currentItem.name}
          locationName={currentItem.location}
          onPress={() =>
            navigate("CourtStack", {
              screen: item.type === "court" ? "CourtDetails" : "BranchDetails",
              params: { id: item.resourceId },
            } as never)
          }
          onBookmarkPress={() => onRemove(item)}
        />
      </Animated.View>
    );
  };

  return (
    <MainWrapper scrollEnabled={false}>
      <Header whiteColor title={t("settings.saved")} />
      <List
        data={savedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        emptyConfig={{
          image: Images.emptyFavorites,
          title: t("profile.noSavedCourts"),
          subtitle: t("profile.noSavedCourtsSubtitle"),
          buttonTitle: t("profile.exploreCourts"),
          onButtonPress: () => navigate("MainTabs", { screen: "Courts" }),
          overrideStyle: themedStyles.emptyContainer,
        }}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
        overrideContainerStyle={themedStyles.list}
        contentContainerStyle={themedStyles.listContainer}
      />
    </MainWrapper>
  );
};

export default SavedScreen;
