import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import {
  GetFriendshipsRequest,
  useFollow,
  useGetFriendships,
  useGetProfile,
  useUnfollow,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import {
  AuthenticatedStackNavigationProp,
  ProfileStackParamList,
} from "navigation/types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "store";
import { flattenData, queryClient, queryKeys } from "utils";

export const useFollowers = () => {
  const { followers, userId } =
    useRoute<RouteProp<ProfileStackParamList, "Followers">>().params;
  const request: GetFriendshipsRequest = {
    type: followers ? "followers" : "following",
    page: 1,
    userId: userId,
  };
  const { data: profileData } = useGetProfile();
  const profileId = profileData?.id;
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetFriendships(request);
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { mutateAsync: followMutation } = useFollow();
  const { mutateAsync: unfollowMutation } = useUnfollow();

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onFollow = async (id: string) => {
    try {
      toggleLoading(true);
      await followMutation({ id });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getFriendships, request],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getProfile],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getUserById, userId],
      });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onUnfollow = async (id: string) => {
    try {
      toggleLoading(true);
      await unfollowMutation({ id });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getFriendships, request],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getProfile],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getUserById, userId],
      });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onUserPress = (id: string) => {
    navigate("Profile", { id });
  };

  const friendshipsData = flattenData(data);

  const headerTitle = followers
    ? t("profile.followers")
    : t("profile.following");

  return {
    headerTitle,
    friendshipsData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isLoading,
    onRefresh,
    isRefreshing,
    onUserPress,
    onFollow,
    onUnfollow,
    followers,
    profileId,
  };
};
