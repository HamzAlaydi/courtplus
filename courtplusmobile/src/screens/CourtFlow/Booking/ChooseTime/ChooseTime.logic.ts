import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useGetCourtAvailability } from "apis";
import { Slot } from "models";
import {
  CourtStackNavigationProp,
  CourtStackParamList,
} from "navigation/types";
import { useState } from "react";
import { useUserStore } from "store";
import { formatDate } from "utils";

export const useChooseTime = () => {
  const route = useRoute<RouteProp<CourtStackParamList, "ChooseTime">>();
  const courtData = route.params.court;

  const { navigate, goBack } = useNavigation<CourtStackNavigationProp>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data, isLoading } = useGetCourtAvailability({
    id: courtData.id,
    date: formatDate(selectedDate.toString(), "yyyy-MM-dd"),
  });
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const updateBooking = useUserStore((store) => store.updateBooking);

  const onNextPress = () => {
    updateBooking({
      court: courtData,
      timeSummary: {
        date: selectedDate,
        slots: selectedSlots,
      },
    });
    navigate("TimeSummary");
  };

  const onTimeSlotPress = (slot: Slot) => {
    const newSlots = [...(selectedSlots ?? [])];
    const timeSlotIndex = (selectedSlots ?? []).findIndex(
      (item) => item.startTime === slot.startTime
    );

    if (timeSlotIndex === -1) {
      newSlots.push(slot);
    } else {
      newSlots.splice(timeSlotIndex, 1);
    }
    setSelectedSlots(newSlots);
  };

  const slots = data?.slots ?? [];
  const isRightButtonDisabled = selectedSlots.length === 0;

  return {
    courtData,
    onNextPress,
    slots,
    setSelectedDate,
    slotsLoading: isLoading,
    onTimeSlotPress,
    selectedSlots,
    selectedDate,
    goBack,
    isRightButtonDisabled,
  };
};
