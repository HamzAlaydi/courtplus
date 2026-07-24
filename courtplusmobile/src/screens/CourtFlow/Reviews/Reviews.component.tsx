import { Header, ReviewItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import { useReviews } from "./Reviews.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Review } from "models";
import { useThemeContext } from "contexts";
import styles from "./Reviews.styles";
import { useTranslation } from "react-i18next";

const ReviewsScreen = () => {
  const {
    reviews,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useReviews();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const renderItem = ({ item }: ListRenderItemInfo<Review>) => {
    return <ReviewItem item={item} />;
  };

  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("reviews.mainTitle")} />
      <List
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isFetching}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        ItemSeparatorComponent={() => <View style={themedStyles.separator} />}
        contentContainerStyle={themedStyles.listContainer}
      />
    </MainWrapper>
  );
};

export default ReviewsScreen;
