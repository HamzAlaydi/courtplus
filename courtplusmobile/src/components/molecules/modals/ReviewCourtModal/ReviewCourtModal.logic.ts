import { usePostReview } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useMemo, useState } from "react";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useReviewCourtModal = (bookingId: string, onClose: () => void) => {
  const { mutateAsync: postReview } = usePostReview();
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const toggleLoading = useAppStore((state) => state.toggleLoading);

  const onDismiss = () => {
    setComment("");
    setRating(0);
  };

  const onAddReviewPress = async () => {
    try {
      toggleLoading(true);
      await postReview({ bookingId, comment, rating });
      invalidateQuery("getBookings");
      invalidateQuery("getCourtDetails");
      invalidateQuery("getCourts");
      invalidateQuery("getCourtReviews");
      onClose();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const isButtonDisabled = useMemo(() => {
    return !comment.length || rating === 0;
  }, [comment, rating]);

  return {
    comment,
    rating,
    onDismiss,
    setComment,
    setRating,
    isButtonDisabled,
    onAddReviewPress,
  };
};
