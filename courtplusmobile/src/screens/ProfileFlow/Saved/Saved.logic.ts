import { useGetBookmarks } from "apis";
import { flattenData } from "utils";

export const useSaved = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetBookmarks();

  // Drop bookmarks whose target court/branch no longer exists.
  const savedData = flattenData(data).filter((item) =>
    item.type === "court" ? !!item.court : !!item.branch
  );
  return {
    savedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  };
};
