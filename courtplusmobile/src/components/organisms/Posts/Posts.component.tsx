import List from "organisms/List/List.component";
import React from "react";
import { PostsProps } from "./Posts.types";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { Post } from "models";
import { PostView } from "molecules/index";
import { View } from "react-native";
import styles from "./Posts.styles";
import { Images } from "theme";
import { useTranslation } from "react-i18next";

const Posts = ({
  postsData,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: PostsProps) => {
  const { t } = useTranslation();
  const renderItem = ({ item }: ListRenderItemInfo<Post>) => {
    return <PostView post={item} />;
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
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      emptyConfig={{
        image: Images.cloud,
        title: t("court.noMoments"),
      }}
    />
  );
};

export default Posts;
