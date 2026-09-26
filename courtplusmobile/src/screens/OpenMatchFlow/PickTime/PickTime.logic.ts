import { areSlotsContiguous } from "utils";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useGetCourtAvailability } from "apis";
import { Slot } from "models";
import { useOpenMatchStore } from "store";

export const usePickTime = () => {
  const date = useOpenMatchStore((store) => store.date);
  const court = useOpenMatchStore((store) => store.court);
  const selectedSlots = useOpenMatchStore((store) => store.selectedSlots);
  const setMatchData = useOpenMatchStore((store) => store.setMatchData);
  const { dispatch } = useNavigation();

  const { data, isLoading } = useGetCourtAvailability({
    id: court?.id ?? "",
    date: new Date(date ?? "").toLocaleDateString("en-CA") ?? "",
  });

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
    setMatchData({ selectedSlots: newSlots });
  };

  const onConfirmPress = () => {
    dispatch(StackActions.popTo("NewMatch"));
  };

  const timeSlots = data?.slots ?? [];

  // Same rule as the court booking flow: a match is one start time plus a
  // duration, so a gap in the selection would book (and charge for) the slot
  // in between.
  const hasGapInSelection = !areSlotsContiguous(selectedSlots ?? []);
  const isDisabled = (selectedSlots?.length ?? 0) === 0 || hasGapInSelection;

  return {
    timeSlots,
    isLoading,
    onTimeSlotPress,
    isDisabled,
    selectedSlots,
    hasGapInSelection,
    onConfirmPress,
  };
};
