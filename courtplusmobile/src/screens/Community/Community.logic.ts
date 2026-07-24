import { useNavigation } from "@react-navigation/native";
import { useFollow, useGetUsers, useUnfollow } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import {
  MainStackNavigationProp,
  MainTabsNavigationProp,
} from "navigation/types";
import { useState } from "react";
import { useAppStore } from "store";
import { useDebounce } from "use-debounce";
import { flattenData, invalidateQuery, queryClient, queryKeys } from "utils";

export const useCommunity = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchValue] = useDebounce(searchInput, 1000);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useGetUsers({ search: debouncedSearchValue, page: 1 });
  const { navigate } = useNavigation<MainStackNavigationProp>();
  const { mutateAsync: followMutation } = useFollow();
  const { mutateAsync: unfollowMutation } = useUnfollow();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      setRefreshing(false);
    }
  };

  const onUserPress = (id: string) => {
    navigate("AuthenticatedStack", { screen: "Profile", params: { id } });
  };

  const onFollow = async (id: string) => {
    try {
      toggleLoading(true);
      await followMutation({ id });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getUsers, debouncedSearchValue],
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
        queryKey: [queryKeys.getUsers, debouncedSearchValue],
      });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const communityData = flattenData(data);
  const isFetching = isLoading && !isFetchingNextPage;

  return {
    debouncedSearchValue,
    searchInput,
    setSearchInput,
    communityData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    onUserPress,
    onFollow,
    onUnfollow,
    onRefresh,
    refreshing,
  };
};
