import { useNavigation } from "@react-navigation/native";
import { useGetCourtAvailability } from "apis";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useState } from "react";
import { DateData } from "react-native-calendars";
import { useOpenMatchStore } from "store";

export const usePickDate = () => {
  const date = useOpenMatchStore((store) => store.date);
  const [selectedDate, setSelectedDate] = useState(
    date ? new Date(date) : new Date()
  );
  const setMatchData = useOpenMatchStore((store) => store.setMatchData);
  const court = useOpenMatchStore((store) => store.court);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const { data, isLoading } = useGetCourtAvailability({
    id: court?.id ?? "",
    month: `${selectedDate.getFullYear()}-${
      selectedDate.getMonth() + 1 < 10 ? "0" : ""
    }${selectedDate.getMonth() + 1}`,
  });

  const onDayPress = (d: DateData) => {
    setMatchData({ date: d.dateString });
    navigate("PickTime");
  };

  const onMonthChange = (date: Date) => {
    setSelectedDate(date);
  };

  const unavailableDays = data?.unavailableDays ?? [];

  return {
    onDayPress,
    date,
    unavailableDays,
    isLoading,
    onMonthChange,
    selectedDate,
  };
};
