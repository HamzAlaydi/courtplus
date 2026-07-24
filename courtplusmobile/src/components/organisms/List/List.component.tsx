import React from "react";
import { FlashList } from "@shopify/flash-list";
import { ListProps } from "./List.types";
import { SkeletonLoader } from "atoms/index";
import styles from "./List.styles";
import { EmptyState } from "molecules/index";

const List = <T,>({
  overrideContainerStyle,
  overrideLoaderContainerStyle,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  emptyConfig,
  ...props
}: ListProps<T>) => {
  const handleEndReached = () => {
    if (!isLoading && !isFetchingNextPage && hasNextPage) {
      fetchNextPage?.();
    }
  };

  if (isLoading)
    return (
      <SkeletonLoader overrideContainerStyle={overrideLoaderContainerStyle} />
    );

  return (
    <FlashList
      {...props}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      removeClippedSubviews
      onEndReachedThreshold={0.3}
      onEndReached={handleEndReached}
      ListFooterComponent={() =>
        isFetchingNextPage ? (
          <SkeletonLoader overrideContainerStyle={styles.loader} />
        ) : null
      }
      style={[overrideContainerStyle]}
      ListEmptyComponent={() => emptyConfig && <EmptyState {...emptyConfig} />}
    />
  );
};

export default List;
