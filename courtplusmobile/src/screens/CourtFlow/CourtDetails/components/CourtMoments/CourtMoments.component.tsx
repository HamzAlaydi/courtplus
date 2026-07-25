import { useGetPosts } from "apis";
import { PostView } from "molecules/index";
import { List } from "organisms/index";
import React from "react";
import { flattenData } from "utils";
import { CourtMomentsProps } from "./CourtMoments.types";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import styles from "./CourtMoments.styles";

const CourtMoments = ({ courtId }: CourtMomentsProps) => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGetPosts({
      page: 1,
      courtId: courtId,
    });
  const postsData = flattenData(data);
  const { t } = useTranslation();

  return (
    <List
      renderItem={({ item }) => <PostView post={item} />}
      data={postsData}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      emptyConfig={{
        overrideStyle: styles.emptyContainer,
        image: Images.cloud,
        title: t("court.noMoments"),
        subtitle: t("court.noMomentsSubtitle"),
      }}
    />
  );
};

export default CourtMoments;
