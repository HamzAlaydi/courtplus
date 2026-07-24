import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useGetCourts } from "apis";
import { Court } from "models";
import { useRef } from "react";
import { useOpenMatchStore, useUserStore } from "store";

export const useChooseCourt = () => {
  const location = useUserStore((store) => store.location);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const setMatchData = useOpenMatchStore((store) => store.setMatchData);
  const { goBack } = useNavigation();

  const {
    data: courts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetCourts(
    {
      page: 1,
      currentLocation: `${location?.lat ?? ""},${location?.long}`,
    },
    !!location
  );

  const onCourtPress = (court: Court) => {
    setMatchData({ court });
    goBack();
  };

  return {
    location,
    bottomSheetModalRef,
    courts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onCourtPress,
  };
};
