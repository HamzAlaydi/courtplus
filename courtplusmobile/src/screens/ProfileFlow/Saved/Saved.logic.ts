import { useGetBookmarks } from "apis";
import { flattenData } from "utils";

export const useSaved = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetBookmarks();

  const savedData = flattenData(data);
  return {
    savedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  };
};
