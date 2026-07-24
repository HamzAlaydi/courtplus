import { useGetUsers } from "apis";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { flattenData } from "utils";

export const useAddPlayersModal = () => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchValue] = useDebounce(searchInput, 1000);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetUsers({ page: 1, search: debouncedSearchValue });
  const customersData = flattenData(data);

  return {
    customersData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    searchInput,
    setSearchInput,
  };
};
