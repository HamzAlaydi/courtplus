import { useNavigation } from "@react-navigation/native";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useMemo, useState } from "react";
import { activityTabsList, Item } from "utils";

export const useActivity = () => {
  const tabs = useMemo(() => activityTabsList, []);
  const [selectedTab, setSelectedTab] = useState<Item>(tabs[0]);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const onBookingDetailsPress = () => {
    navigate("ActivityStack", { screen: "BookingDetails" });
  };

  return {
    tabs,
    selectedTab,
    setSelectedTab,
  };
};
