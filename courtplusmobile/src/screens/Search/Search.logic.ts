import { useNavigation } from "@react-navigation/native";
import { useGetCourts } from "apis";
import { Court } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useEffect, useMemo, useState } from "react";
import { useUserStore } from "store";
import { useDebounce } from "use-debounce";
import { Item, SportFilterItem, sports } from "utils";

export const useSearch = () => {
  const location = useUserStore((store) => store.location);

  const tabs = useMemo(
    () => [
      {
        key: "courts",
        title: "Courts",
      },
    ],
    []
  );
  const [selectedTab, setSelectedTab] = useState<Item>(tabs[0]);
  const [selectedSports, setSelectedSports] = useState<SportFilterItem[]>([
    sports[0],
  ]);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchValue] = useDebounce(searchInput, 1000);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const sportQuery = useMemo(() => {
    if (
      selectedSports.length === 1 &&
      selectedSports[0].value === "all_courts"
    ) {
      return undefined;
    }
    return selectedSports.map((sport) => sport.value).join(",");
  }, [selectedSports]);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetCourts(
      {
        page: 1,
        lat: location?.lat,
        lng: location?.long,
        sport: sportQuery,
        search: debouncedSearchValue,
      },
      !!debouncedSearchValue
    );

  const onNotificationPress = () => {
    navigate("Notifications");
  };

  const onCourtPress = (item: Court) => {
    navigate("CourtStack", { screen: "CourtDetails", params: { id: item.id } });
  };

  return {
    tabs,
    setSelectedTab,
    selectedTab,
    selectedSports,
    setSelectedSports,
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    setSearchInput,
    searchInput,
    onNotificationPress,
    onCourtPress,
  };
};
