import { useQuery } from "@tanstack/react-query";
import { getMatches } from "../../actions/match_actions";
import { endOfMonth, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Loading from "../../utils/Loading";
import { Tag } from "antd";

dayjs.extend(utc);

// Generate 18 half-hour slots starting at 9:00 (each slot is a dayjs object)
const timeSlots = Array.from({ length: 48 }, (_, i) =>
  dayjs()
    .hour(0)
    .minute(i * 30)
    .second(0)
    .millisecond(0)
);

export default function BookingTab({ courtId }) {
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const startDate = startOfMonth(date).toISOString();
  const endDate = endOfMonth(date).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["court-matches", startDate, endDate, courtId],
    queryFn: () =>
      getMatches({
        startDate,
        endDate,
        page: 1,
        pageSize: 100,
        courtId,
      }),
  });

  // Group bookings by date (YYYY-MM-DD)
  const bookingsByDate = useMemo(() => {
    const matches = data?.items || [];
    const grouped = matches.reduce((acc, curr) => {
      const date = dayjs(curr.startDate).format("YYYY-MM-DD");
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {});
    return grouped;
  }, [data]);

  const availableDays = useMemo(
    () => Object.keys(bookingsByDate),
    [bookingsByDate]
  );

  // Calculate booked slots for the selected date as array of start times "HH:mm"
  const bookedSlots = useMemo(() => {
    if (!selectedDate) return [];

    const key = dayjs(selectedDate).format("YYYY-MM-DD");

    return (
      bookingsByDate[key]?.flatMap((booking) => {
        const start = dayjs(booking.startDate).format("HH:mm");
        const end = dayjs(booking.endDate).format("HH:mm");

        return timeSlots
          .filter((slot) => {
            const slotTime = slot.format("HH:mm");

            // Compare time strings directly since format is fixed ("HH:mm")
            return (
              slotTime >= start &&
              dayjs(slotTime, "HH:mm").add(30, "minute").format("HH:mm") <= end
            );
          })
          .map((slot) => slot.format("HH:mm"));
      }) || []
    );
  }, [selectedDate, bookingsByDate]);

  // Add class for available days in calendar
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const dayStr = dayjs(date).format("YYYY-MM-DD");
    if (availableDays.includes(dayStr)) {
      return "available-day";
    }
    return "";
  };

  if (isLoading) return <Loading />;

  return (
    <div
      className="calendar-availability-container"
      style={{ display: "flex", gap: "30px" }}
    >
      <div className="calendar">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          onActiveStartDateChange={({ activeStartDate }) => {
            setDate(activeStartDate);
          }}
          tileClassName={tileClassName}
          calendarType="gregory"
        />
      </div>

      <div className="slots-panel">
        <h3>{dayjs(selectedDate).format("DD MMMM YYYY")}</h3>
        <div
          className="slots"
          style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
        >
          {timeSlots.map((slot) => {
            const slotStr = `${slot.format("HH:mm")} - ${slot
              .add(30, "minute")
              .format("HH:mm")}`;
            const isBooked = bookedSlots.includes(slot.format("HH:mm"));
            return (
              <Tag
                className="time-slot"
                key={slotStr}
                style={{
                  backgroundColor: isBooked ? "#00c853" : "#f0f0f0",
                  color: isBooked ? "#fff" : "#000",
                }}
              >
                {slotStr}
              </Tag>
            );
          })}
        </div>
      </div>
    </div>
  );
}
