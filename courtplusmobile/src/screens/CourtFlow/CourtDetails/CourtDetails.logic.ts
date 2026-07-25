import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useDeleteBookmark, useGetCourtDetails, usePostBookmark } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { Sport } from "models";
import {
  CourtStackNavigationProp,
  CourtStackParamList,
} from "navigation/types";
import { useMemo } from "react";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useCourtDetails = () => {
  const route = useRoute<RouteProp<CourtStackParamList, "CourtDetails">>();
  const { id } = route.params;
  const { navigate } = useNavigation<CourtStackNavigationProp>();
  const { data, isLoading, isRefetching, refetch } = useGetCourtDetails({
    id,
  });
  const { mutateAsync: postBookmarkMutation } = usePostBookmark();
  const { mutateAsync: deleteBookmarkMutation } = useDeleteBookmark();
  const toggleLoading = useAppStore((state) => state.toggleLoading);

  const onBookCourtPress = () => {
    navigate("ChooseTime", {
      court: data!!,
    });
  };

  const onBookmarkPress = async () => {
    try {
      toggleLoading(true);
      if (data?.isBookmarked) {
        await deleteBookmarkMutation(id);
      } else {
        await postBookmarkMutation({
          resourceId: id,
          type: "court",
        });
      }
      invalidateQuery("getCourtDetails");
      invalidateQuery("getMyBookmarks");
      invalidateQuery("getCourts");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onReviewPress = () => {
    navigate("Reviews", { courtId: id });
  };

  const courtSport: Sport = useMemo(
    () => ({
      id: "",
      name: data?.sport || "",
      level: "",
      userId: "",
      timePreference: "",
    }),
    [data]
  );

  return {
    onBookCourtPress,
    data,
    isLoading,
    isRefetching,
    refetch,
    courtSport,
    onBookmarkPress,
    onReviewPress,
  };
};
