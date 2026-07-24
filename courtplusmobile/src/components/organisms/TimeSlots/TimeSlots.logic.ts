import { Slot, TimeSlot } from "models";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useTimeSlots = (slots: Slot[]) => {
  const { t } = useTranslation();

  const morningSlots = slots?.filter((item) => item.startTime < "13:00");
  const daysSlots = slots?.filter(
    (item) => item.startTime >= "13:00" && item.startTime <= "18:00"
  );
  const eveningSlots = slots?.filter(
    (item) => item.startTime > "18:00" && item.startTime <= "24:00"
  );

  const mappedSlots: TimeSlot[] = useMemo(() => {
    const slotsArr: TimeSlot[] = [];
    if (morningSlots?.length) {
      slotsArr.push({
        label: t("booking.morning"),
        time: morningSlots,
      });
    }
    if (daysSlots?.length) {
      slotsArr.push({
        label: t("booking.day"),
        time: daysSlots,
      });
    }
    if (eveningSlots?.length) {
      slotsArr.push({
        label: t("booking.evening"),
        time: eveningSlots,
      });
    }
    return slotsArr;
  }, [morningSlots, daysSlots, eveningSlots]);

  return {
    mappedSlots,
  };
};
