import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useGetCourts } from "apis";
import { Court } from "models";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useUserStore } from "store";
import { Item, SportFilterItem, sports } from "utils";

export const useCourts = () => {
  const location = useUserStore((store) => store.location);
  const [selectedSports, setSelectedSports] = useState<SportFilterItem[]>([
    sports[0],
  ]);
  const sortModalRef = useRef<BottomSheetModal>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const [sortItem, setSortItem] = useState<Item | null>(null);

  const sortQuery = useMemo(() => {
    if (sortItem?.key) {
      return sortItem.key.split(",");
    }
    return [];
  }, [sortItem]);

  const sportQuery = useMemo(() => {
    if (
      selectedSports.length === 1 &&
      selectedSports[0].value === "all_courts"
    ) {
      return undefined;
    }
    return selectedSports.map((sport) => sport.value).join(",");
  }, [selectedSports]);
  const {
    data: courts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCourts(
    {
      page: 1,
      lat: location?.lat,
      lng: location?.long,
      sport: sportQuery,
      sortBy: sortQuery[0],
      sortDirection: sortQuery[1],
    },
    !!location
  );

  const onSearchFocus = () => {
    Keyboard.dismiss();
    navigate("Search");
  };

  const onSortPress = () => {
    sortModalRef.current?.present();
  };

  const onCourtPress = (item: Court) => {
    navigate("CourtStack", { screen: "CourtDetails", params: { id: item.id } });
  };

  const onNotificationPress = () => {
    navigate("Notifications");
  };

  const onSelectSort = (sort: Item) => {
    sortModalRef.current?.dismiss();
    setSortItem(sort);
  };

  const onClearSort = () => {
    setSortItem(null);
  };

  const onFilterPress = () => {
    navigate("CourtStack", { screen: "CourtFilter" });
  };

  return {
    courts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    location,
    setSelectedSports,
    onSearchFocus,
    sortModalRef,
    onSortPress,
    bottomSheetModalRef,
    onCourtPress,
    onNotificationPress,
    sortItem,
    onSelectSort,
    onClearSort,
    onFilterPress,
  };
};
