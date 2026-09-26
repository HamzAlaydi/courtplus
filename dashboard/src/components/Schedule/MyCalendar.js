import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getMatches } from "../../actions/match_actions";
import { format as formatDate } from "date-fns";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MyCalendar = ({ branchId }) => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const startDate = startOfMonth(date).toISOString();
  const endDate = endOfMonth(date).toISOString();

  const { data, error } = useQuery({
    queryKey: ["matches", startDate, endDate, branchId],
    queryFn: () =>
      getMatches({
        startDate,
        endDate,
        page: 1,
        pageSize: 100,
        branchId: branchId,
      }),
  });

  if (error) console.log(error);

  // Transform match data into calendar events. Cancelled bookings are left
  // out: the slot is free again, and showing them as if they were still on
  // made the calendar look fully booked.
  const events = (data?.items || [])
    .filter((match) => match.status !== "cancelled")
    .map((match) => {
    const start = new Date(match.startDate);
    const end = new Date(match.endDate);
    const formattedTitle = `${formatDate(start, "HH:mm")} - ${formatDate(
      end,
      "HH:mm"
    )} | ${match.court?.name || "Unknown Court"}`;

      return {
        id: match.id,
        title: formattedTitle,
        start,
        end,
      };
    });

  // Navigate to match details when an event is clicked
  const handleEventClick = (event) => {
    navigate(`/schedule/${event.id}`);
  };

  return (
    <div style={{ height: "85vh" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        date={date}
        view={view}
        onNavigate={setDate}
        onView={setView}
        onSelectEvent={handleEventClick}
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default MyCalendar;
