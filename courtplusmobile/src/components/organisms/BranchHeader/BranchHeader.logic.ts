import { useDeleteBookmark, usePostBookmark } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useBranchHeader = ({
  id,
  isBookmarked,
}: {
  id: string;
  isBookmarked: boolean;
}) => {
  const { mutateAsync: postBookmarkMutation } = usePostBookmark();
  const { mutateAsync: deleteBookmarkMutation } = useDeleteBookmark();
  const toggleLoading = useAppStore((state) => state.toggleLoading);

  const onBookmarkPress = async () => {
    try {
      toggleLoading(true);
      if (isBookmarked) {
        await deleteBookmarkMutation(id);
      } else {
        await postBookmarkMutation({
          resourceId: id,
          type: "branch",
        });
      }
      invalidateQuery("getBranchById");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  return {
    onBookmarkPress,
  };
};
