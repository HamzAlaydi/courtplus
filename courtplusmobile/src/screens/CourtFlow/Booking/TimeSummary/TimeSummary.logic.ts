import { useUserStore } from "store";
import { formatDate, formatTimeRange } from "utils";

export const useTimeSummary = () => {
  const bookingData = useUserStore((store) => store.bookingData);
  const formattedDate = formatDate(
    bookingData?.timeSummary?.date?.toString() ?? "",
    "dd MMM yyyy"
  );

  const formattedTime = formatTimeRange(bookingData?.timeSummary?.slots ?? []);

  const courtData = bookingData?.court;
  return {
    formattedDate,
    formattedTime,
    courtData,
  };
};
