import { useDeleteBookmark, useGetBookmarks } from "apis";
import { Bookmark } from "models";
import { invalidateQuery } from "utils";
import { flattenData } from "utils";

export const useSaved = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetBookmarks();

  // Drop bookmarks whose target court/branch no longer exists.
  const savedData = flattenData(data).filter((item) =>
    item.type === "court" ? !!item.court : !!item.branch
  );
  // Both handlers on the saved list were empty: rows could neither be
  // opened nor unsaved.
  const { mutateAsync: deleteBookmark } = useDeleteBookmark();
  const onRemove = async (item: Bookmark) => {
    try {
      await deleteBookmark(item.resourceId);
      invalidateQuery("getMyBookmarks");
    } catch {
      // keep the row; the next refresh shows the truth
    }
  };

  return {
    savedData,
    onRemove,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  };
};
