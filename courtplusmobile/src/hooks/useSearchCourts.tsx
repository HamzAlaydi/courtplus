import { useInfiniteQuery } from "@tanstack/react-query";
import { getCourts } from "apis";
import { useRef, useState, useTransition } from "react";
import { useUserStore } from "store";
import { getNextPage, queryKeys } from "utils";

export const useSearchCourts = () => {
  const location = useUserStore((store) => store.location);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const searchFilters = useUserStore((store) => store.searchFilters);
  const [isPending, startTransition] = useTransition();
  const debouncedRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isFetching } = useInfiniteQuery({
    queryKey: [queryKeys.getSearchCourts, debouncedSearchValue, searchFilters],
    initialPageParam: 1,
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) =>
      getCourts({
        page: pageParam,
        currentLocation: `${location?.lat},${location?.long}`,
        search: debouncedSearchValue,
        ...searchFilters,
      }),
    getNextPageParam: (lastPage, pages) =>
      lastPage ? getNextPage(lastPage, pages) : undefined,
    enabled: !!debouncedSearchValue,
  });

  const onHandleSearchValue = (text: string) => {
    setSearchInput(text);
    if (debouncedRef.current) {
      clearTimeout(debouncedRef.current);
    }
    debouncedRef.current = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchValue(text);
      });
    }, 1000);
  };

  const courtData = data?.pages?.flatMap((item) => item) ?? [];

  const isLoading = isPending || isFetching;

  return {
    courtData,
    setSearchInput,
    searchInput,
    isLoading,
    debouncedSearchValue,
    onHandleSearchValue,
  };
};
