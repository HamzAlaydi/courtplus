import { useNavigation } from "@react-navigation/native";
import { useGetCourts } from "apis";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { useUserStore } from "store";
import { Images } from "theme";
import { SportFilterItem, sports } from "utils";

export const useHome = () => {
  const location = useUserStore((store) => store.location);
  const [selectedSports, setSelectedSports] = useState<SportFilterItem[]>([
    sports[0],
  ]);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  const { t } = useTranslation();

  const sportQuery = useMemo(() => {
    if (
      selectedSports.length === 1 &&
      selectedSports[0].value === "all_courts"
    ) {
      return undefined;
    }
    return selectedSports.map((sport) => sport.value).join(",");
  }, [selectedSports]);

  const { data: courts, isLoading: isCourtsLoading } = useGetCourts(
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

  const actionCards = useMemo(
    () => [
      {
        imageBg: Images.openMatch,
        image: Images.speedBall,
        title: t("court.openMatch"),
        description: t("court.openMatchDescription"),
        onPress: onOpenMatchPress,
      },
      {
        imageBg: Images.coach,
        image: Images.whistle,
        title: t("court.coaches"),
        description: t("court.coachesDescription"),
        onPress: onCoachesPress,
      },
    ],
    [t]
  );

  const onSearchFocus = () => {
    Keyboard.dismiss();
    navigate("Search");
  };

  const isLoading = isCourtsLoading;

  return {
    isLoading,
    courts,
    location,
    setSelectedSports,
    onSearchFocus,
    actionCards,
  };
};
