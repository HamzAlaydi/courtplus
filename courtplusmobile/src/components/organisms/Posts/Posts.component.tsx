import List from "organisms/List/List.component";
import React from "react";
import { PostsProps } from "./Posts.types";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Post } from "models";
import { PostView } from "molecules/index";
import Animated from "react-native-reanimated";
import styles from "./Posts.styles";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useListEntering } from "utils";

const Posts = ({
  postsData,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: PostsProps) => {
  const { t } = useTranslation();
  const entering = useListEntering();
  const renderItem = ({ item, index }: ListRenderItemInfo<Post>) => {
    return (
      <Animated.View entering={entering(index)}>
        <PostView post={item} />
      </Animated.View>
    );
  };

  return (
    <List
      data={postsData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      contentContainerStyle={styles.container}
      emptyConfig={{
        image: Images.cloud,
        title: t("court.noMoments"),
      }}
    />
  );
};

export default Posts;
