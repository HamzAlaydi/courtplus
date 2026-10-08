import { Header, ReviewItem } from "molecules/index";
import { List, MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useReviews } from "./Reviews.logic";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Review } from "models";
import { useThemeContext } from "contexts";
import styles from "./Reviews.styles";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { useListEntering } from "utils";

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
  const entering = useListEntering();

  const renderItem = ({ item, index }: ListRenderItemInfo<Review>) => {
    return (
      <Animated.View entering={entering(index)}>
        <ReviewItem item={item} />
      </Animated.View>
    );
  };

  return (
    <MainWrapper overrideContentStyle={themedStyles.container}>
      <Header
        whiteColor
        title={t("reviews.mainTitle")}
        overrideStyle={themedStyles.header}
      />
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
        emptyConfig={{
          image: Images.emptyStar,
          title: t("reviews.noReviews"),
          subtitle: t("reviews.noReviewsSubtitle"),
        }}
      />
    </MainWrapper>
  );
};

export default ReviewsScreen;
