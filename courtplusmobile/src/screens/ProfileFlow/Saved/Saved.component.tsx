import { useThemeContext } from "contexts";
import { BookmarkItem, Header } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Images } from "theme";
import styles from "./Saved.styles";
import { useTranslation } from "react-i18next";
import { useSaved } from "./Saved.logic";
import { Bookmark } from "models";
import { View } from "react-native";

const SavedScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const {
    savedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSaved();

  const renderItem = ({ item }: { item: Bookmark }) => {
    const currentItem =
      item.type === "court"
        ? { name: item.court.name, location: item.court.branch.name }
        : { name: item.branch.tenantId, location: item.branch.location.name };
    return (
      <BookmarkItem
        image={Images.openMatch}
        title={currentItem.name}
        locationName={currentItem.location}
        onPress={() => {}}
        onBookmarkPress={() => {}}
      />
    );
  };

  return (
    <MainWrapper scrollEnabled overrideContainerStyle={themedStyles.container}>
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
          overrideStyle: themedStyles.emptyContainer,
        }}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
        contentContainerStyle={themedStyles.listContainer}
      />
    </MainWrapper>
  );
};

export default SavedScreen;
