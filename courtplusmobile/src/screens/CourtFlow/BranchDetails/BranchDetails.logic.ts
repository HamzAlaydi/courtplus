import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetBranchById } from "apis";
import { CourtStackParamList } from "navigation/types";
import { useMemo, useState } from "react";
import { sportList } from "utils";

export const useBranchDetails = () => {
  const route = useRoute<RouteProp<CourtStackParamList, "BranchDetails">>();
  const { id } = route.params;
  const { data, isLoading } = useGetBranchById({ id });
  const tabs = useMemo(
    () =>
      sportList.filter(
        (item) => !!data?.courts?.find((court) => item.key === court.sport)
      ),
    [data]
  );
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  return {
    data,
    isLoading,
    tabs,
    selectedTab,
    setSelectedTab,
  };
};
