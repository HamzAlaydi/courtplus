import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Images } from "theme";

export const usePreferredTimeSelector = (selectedPreferredTime: string) => {
  const { t } = useTranslation();
  const [selectedTime, setSelectedTime] = useState<string>(
    selectedPreferredTime
  );
  const preferredTimeItems = useMemo(
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

  const handleSelectTime = (key: string) => {
    setSelectedTime(key);
  };

  const isNextButtonDisabled = !selectedTime;

  return {
    preferredTimeItems,
    handleSelectTime,
    selectedTime,
    isNextButtonDisabled,
  };
};
