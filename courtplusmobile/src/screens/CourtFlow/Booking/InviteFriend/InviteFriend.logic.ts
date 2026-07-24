import { StackActions, useNavigation } from "@react-navigation/native";
import { useGetUsers } from "apis";
import { User } from "models";
import { CourtStackNavigationProp } from "navigation/types";
import { useState } from "react";
import { useUserStore } from "store";
import { useDebounce } from "use-debounce";
import { flattenData } from "utils";

export const useInviteFriend = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchValue] = useDebounce(searchInput, 1000);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetUsers({ page: 1, search: debouncedSearchValue });
  const customersData = flattenData(data);
  const isFetching = isLoading && !isFetchingNextPage;
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const { dispatch, navigate } = useNavigation<CourtStackNavigationProp>();
  const clearBooking = useUserStore((store) => store.clearBooking);
  const updateBooking = useUserStore((store) => store.updateBooking);

  const onAddPress = (friend: User) => {
    if (selectedFriends.length < 4) {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const onRemovePress = (friend: User) => {
    const newSelectedFriends = selectedFriends.filter(
      (item) => item.id !== friend.id
    );
    setSelectedFriends(newSelectedFriends);
  };

  const onCancelPress = () => {
    clearBooking();
    dispatch(StackActions.popToTop());
  };

  const onNextPress = () => {
    updateBooking({
      participants: selectedFriends,
    });
    navigate("BookingSummary");
  };

  return {
    customersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    searchInput,
    setSearchInput,
    onAddPress,
    selectedFriends,
    onRemovePress,
    onCancelPress,
    onNextPress,
  };
};
