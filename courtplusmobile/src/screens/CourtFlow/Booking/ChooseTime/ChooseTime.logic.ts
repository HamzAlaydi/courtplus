import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useGetCourtAvailability } from "apis";
import { Slot } from "models";
import {
  CourtStackNavigationProp,
  CourtStackParamList,
} from "navigation/types";
import { useState } from "react";
import { useUserStore } from "store";
import { formatDate, getSlotsDurationMinutes, areSlotsContiguous} from "utils";

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
  // A booking is one start time plus a duration, so a gap in the selection
  // would book and charge for the slot in between — which may already be
  // taken. Block it instead of silently widening the booking.
  const hasGapInSelection = !areSlotsContiguous(selectedSlots ?? []);
  const isRightButtonDisabled =
    selectedSlots.length === 0 || hasGapInSelection;

  // The header chips used to be hard-coded to "30 mins" and the court's
  // hourly rate no matter what the customer picked, so a 30-minute booking on
  // a 150/h court advertised 150 and charged 75.
  const selectedDurationMinutes = getSlotsDurationMinutes(selectedSlots ?? []);
  const selectedTotalCost =
    Math.round(
      ((courtData?.hourlyRate ?? 0) * (selectedDurationMinutes / 60) +
        Number.EPSILON) * 100,
    ) / 100;

  return {
    courtData,
    selectedDurationMinutes,
    selectedTotalCost,
    onNextPress,
    slots,
    setSelectedDate,
    slotsLoading: isLoading,
    onTimeSlotPress,
    selectedSlots,
    selectedDate,
    goBack,
    isRightButtonDisabled,
    hasGapInSelection,
  };
};
