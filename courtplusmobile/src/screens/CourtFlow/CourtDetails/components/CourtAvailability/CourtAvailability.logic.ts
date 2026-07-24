import { useGetCourtAvailability } from "apis";
import { useState } from "react";

export const useCourtAvailability = (courtId: string) => {
  const [date, setDate] = useState(new Date());
  const { data, isLoading } = useGetCourtAvailability({
    id: courtId,
    month: `${date.getFullYear()}-${date.getMonth() + 1 < 10 ? "0" : ""}${
      date.getMonth() + 1
    }`,
  });

  const onMonthChange = (date: Date) => {
    setDate(date);
  };

  const unavailableDays = data?.unavailableDays ?? [];

  return {
    unavailableDays,
    isLoading,
    onMonthChange,
  };
};
