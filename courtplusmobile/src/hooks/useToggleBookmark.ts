import { useDeleteBookmark, usePostBookmark } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { Court } from "models";
import { useEffect, useState } from "react";
import { invalidateQuery } from "utils";

/**
 * Optimistic bookmark toggle for court cards in lists. Uses the same
 * bookmarks service as CourtDetails (POST /bookmarks, DELETE /bookmarks/:id)
 * and keeps Profile → Saved in sync via query invalidation.
 */
export const useToggleBookmark = (court: Court) => {
  const [isBookmarked, setIsBookmarked] = useState(!!court.isBookmarked);
  const { mutateAsync: postBookmarkMutation } = usePostBookmark();
  const { mutateAsync: deleteBookmarkMutation } = useDeleteBookmark();

  useEffect(() => {
    setIsBookmarked(!!court.isBookmarked);
  }, [court.isBookmarked]);

  const onBookmarkPress = async () => {
    const previous = isBookmarked;
    setIsBookmarked(!previous);
    try {
      if (previous) {
        await deleteBookmarkMutation(court.id);
      } else {
        await postBookmarkMutation({ resourceId: court.id, type: "court" });
      }
      invalidateQuery("getMyBookmarks");
      invalidateQuery("getCourts");
      invalidateQuery("getCourtDetails");
    } catch (error) {
      setIsBookmarked(previous);
      showSnackbar({ message: (error as Error).message });
    }
  };

  return {
    isBookmarked,
    onBookmarkPress,
  };
};
