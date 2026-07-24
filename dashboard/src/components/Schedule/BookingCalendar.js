import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import dayjs from "dayjs";

const BookingCalendar = ({ value, onChange, availability, onMonthChange }) => {
  return (
    <Calendar
      className="booking-calendar"
      value={value}
      onChange={onChange}
      onActiveStartDateChange={({ activeStartDate }) => {
        const month = dayjs(activeStartDate).format("YYYY-MM");
        onMonthChange?.(month);
      }}
      tileClassName={({ date, view }) => {
        if (view !== "month") return "";

        const day = date.getDate();

        if (availability?.availableDays?.includes(day)) {
          return "available-day";
        }

        if (availability?.unavailableDays?.includes(day)) {
          return "unavailable-day";
        }

        return "";
      }}
    />
  );
};

export default BookingCalendar;
