import { useNavigation } from "@react-navigation/native";
import { CourtStackNavigationProp } from "navigation/types";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "store";
import { Images } from "theme";
import { formatDate, sports } from "utils";

/** Representative start hour for each day period (backend needs HH:mm). */
const PERIOD_HOURS: Record<string, string> = {
  morning: "08:00",
  day: "12:00",
  evening: "18:00",
  night: "21:00",
};

const periodFromHour = (hour: number) => {
  if (hour < 9) {
    return "morning";
  }
  if (hour < 16) {
    return "day";
  }
  if (hour < 21) {
    return "evening";
  }
  return "night";
};

const DURATION_OPTIONS = [60, 90, 120];
const DEFAULT_PERIOD = "evening";

export const useCourtFilter = () => {
  const { t } = useTranslation();
  const { goBack } = useNavigation<CourtStackNavigationProp>();
  const storedFilters = useUserStore((store) => store.filters);
  const updateFilters = useUserStore((store) => store.updateFilters);
  const clearFilters = useUserStore((store) => store.clearFilters);

  const storedStartAt = useMemo(
    () =>
      storedFilters?.startAt
        ? new Date(storedFilters.startAt.replace(" ", "T"))
        : undefined,
    [storedFilters?.startAt]
  );

  const [selectedSports, setSelectedSports] = useState<string[]>(
    storedFilters?.sport?.split(",").filter(Boolean) ?? []
  );
  const [minRating, setMinRating] = useState(storedFilters?.minRating ?? 0);
  const [availabilityEnabled, setAvailabilityEnabled] = useState(
    !!storedFilters?.startAt
  );
  const [airConditionedOnly, setAirConditionedOnly] = useState(
    !!storedFilters?.isAirConditioned
  );
  const [selectedDate, setSelectedDate] = useState(storedStartAt ?? new Date());
  const [selectedPeriod, setSelectedPeriod] = useState(
    storedStartAt ? periodFromHour(storedStartAt.getHours()) : DEFAULT_PERIOD
  );
  const [duration, setDuration] = useState(
    storedFilters?.duration ?? DURATION_OPTIONS[0]
  );

  const sportOptions = useMemo(
    () => sports.filter((sport) => sport.value !== "all_courts"),
    []
  );

  const periodItems = useMemo(
    () => [
      {
        key: "morning",
        image: Images.sunrise,
        name: t("profile.morning"),
        time: t("profile.morningTime"),
      },
      {
        key: "day",
        image: Images.sun,
        name: t("profile.day"),
        time: t("profile.dayTime"),
      },
      {
        key: "evening",
        image: Images.sunset,
        name: t("profile.evening"),
        time: t("profile.eveningTime"),
      },
      {
        key: "night",
        image: Images.night,
        name: t("profile.night"),
        time: t("profile.nightTime"),
      },
    ],
    [t]
  );

  const onSportPress = (value: string) => {
    setSelectedSports((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const onApply = () => {
    updateFilters({
      sport: selectedSports.length ? selectedSports.join(",") : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      startAt: availabilityEnabled
        ? `${formatDate(selectedDate.toString(), "yyyy-MM-dd")} ${
            PERIOD_HOURS[selectedPeriod]
          }`
        : undefined,
      duration: availabilityEnabled ? duration : undefined,
      isAirConditioned: airConditionedOnly ? true : undefined,
    });
    goBack();
  };

  const onClear = () => {
    setSelectedSports([]);
    setMinRating(0);
    setAvailabilityEnabled(false);
    setAirConditionedOnly(false);
    setSelectedDate(new Date());
    setSelectedPeriod(DEFAULT_PERIOD);
    setDuration(DURATION_OPTIONS[0]);
    clearFilters();
  };

  return {
    sportOptions,
    selectedSports,
    onSportPress,
    minRating,
    setMinRating,
    availabilityEnabled,
    setAvailabilityEnabled,
    airConditionedOnly,
    setAirConditionedOnly,
    selectedDate,
    setSelectedDate,
    periodItems,
    selectedPeriod,
    setSelectedPeriod,
    durationOptions: DURATION_OPTIONS,
    duration,
    setDuration,
    onApply,
    onClear,
  };
};
