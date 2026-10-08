import { useNavigation } from "@react-navigation/native";
import { useGetCourts, useGetProfile } from "apis";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { useUserStore } from "store";
import { SportFilterItem, sports } from "utils";
import { HomeQuickAction } from "./Home.types";

export const useHome = () => {
  const location = useUserStore((store) => store.location);
  const [selectedSports, setSelectedSports] = useState<SportFilterItem[]>([
    sports[0],
  ]);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const { t } = useTranslation();
  const { data: profile } = useGetProfile();

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
    isLoading: isCourtsLoading,
    isRefetching,
    refetch,
  } = useGetCourts(
    {
      page: 1,
      pageSize: 9,
      lat: location?.lat,
      lng: location?.long,
      sport: sportQuery,
    },
    !!location
  );

  const onCoachesPress = () => {
    navigate("Coaches");
  };

  const onOpenMatchPress = () => {
    navigate("OpenMatch");
  };

  const onCourtsPress = () => {
    navigate("MainTabs", { screen: "Courts" });
  };

  // Courts is a tab rather than part of CourtStack, so switch to it first and
  // open the filter on top: applying (goBack) lands on the filtered list.
  const onFilterPress = () => {
    navigate("MainTabs", { screen: "Courts" });
    navigate("CourtStack", { screen: "CourtFilter" });
  };

  const onBookingsPress = () => {
    navigate("MainTabs", { screen: "Activity" });
  };

  const onProfilePress = () => {
    navigate("MainTabs", { screen: "Profile" });
  };

  const onNotificationPress = () => {
    navigate("Notifications");
  };

  const onCourtPress = (id: string) => {
    navigate("CourtStack", { screen: "CourtDetails", params: { id } });
  };

  const quickActions = useMemo<HomeQuickAction[]>(
    () => [
      {
        key: "courts",
        title: t(["home.bookCourt", "tabs.courts"]),
        onPress: onCourtsPress,
      },
      {
        key: "bookings",
        title: t(["home.myBookings", "activity.currentBookings"]),
        onPress: onBookingsPress,
      },
      {
        key: "openMatch",
        title: t("court.openMatch"),
        onPress: onOpenMatchPress,
      },
      {
        key: "coaches",
        title: t("court.coaches"),
        onPress: onCoachesPress,
      },
    ],
    [t]
  );

  const greeting = profile?.firstName
    ? t(["home.greeting", "onboarding.title1"], {
        name: profile.firstName,
        // Rendered as plain text, so names like O'Brien or A&B stay intact.
        interpolation: { escapeValue: false },
      })
    : t("onboarding.title1");
  const subtitle = t(["home.subtitle", "openMatch.description"]);

  const onSearchFocus = () => {
    Keyboard.dismiss();
    navigate("Search");
  };

  const isLoading = isCourtsLoading;

  return {
    isLoading,
    courts,
    location,
    profile,
    greeting,
    subtitle,
    setSelectedSports,
    onSearchFocus,
    quickActions,
    onCourtsPress,
    onFilterPress,
    onCourtPress,
    onNotificationPress,
    onProfilePress,
    isRefetching,
    refetch,
  };
};
