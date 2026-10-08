import React, { useState, useEffect, useMemo } from "react";
import { Form, Switch, TimePicker, Select, Button, Tag } from "antd";
import dayjs from "dayjs";
import {
  timeZones,
  getOffsetLabel,
  getCurrentTime,
  searchTextFor,
} from "../modules/timeZones";
import { useTranslation } from "react-i18next";

// A venue open around the clock is stored as an equal start and end. The
// backend treats that as a full 24-hour window (see Availability.getSlots).
const FULL_DAY_START = "00:00";
const FULL_DAY_END = "00:00";

const isFullDay = (d) =>
  !!d.startTime &&
  !!d.endTime &&
  d.startTime.format("HH:mm") === FULL_DAY_START &&
  d.endTime.format("HH:mm") === FULL_DAY_END;

// ✅ Mapping days to numbers
const dayToNumber = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

// ✅ Reverse mapping to get day names from numbers
const numberToDay = Object.entries(dayToNumber).reduce(
  (acc, [day, num]) => ({ ...acc, [num]: day }),
  {}
);

const daysOfWeek = Object.keys(dayToNumber);

// ✅ Set Default Working Days (Empty State)
const defaultWorkingDays = daysOfWeek.reduce((acc, day) => {
  acc[day] = {
    enabled: false,
    startTime: dayjs("09:00", "HH:mm"), // Default Start Time: 09:00 AM
    endTime: dayjs("21:00", "HH:mm"), // Default End Time: 09:00 PM
  };
  return acc;
}, {});

export default function WorkingHours({ title, initialSchedule, onChange }) {
  const { t } = useTranslation();

  // ✅ Load initialSchedule into workingDays state
  const [workingDays, setWorkingDays] = useState(defaultWorkingDays);

  // Drives the live "current time" shown next to each zone. One minute is
  // plenty and keeps this far away from a render loop.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (initialSchedule?.availabilities?.length > 0) {
      const updatedDays = { ...defaultWorkingDays };

      initialSchedule.availabilities.forEach(({ days, startTime, endTime }) => {
        days.forEach((dayNumber) => {
          const dayName = numberToDay[dayNumber];
          if (dayName) {
            updatedDays[dayName] = {
              enabled: true,
              startTime: dayjs(startTime, "HH:mm"),
              endTime: dayjs(endTime, "HH:mm"),
            };
          }
        });
      });

      setWorkingDays(updatedDays);
    }
  }, [initialSchedule]);

  // 🔹 Handle enabling/disabling a day
  const handleSwitchChange = (day, checked) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: checked },
    }));
  };

  // 🔹 Toggle a single day between 24-hour and the default window
  const handleFullDayToggle = (day) => {
    setWorkingDays((prev) => {
      const current = prev[day];
      const next = isFullDay(current)
        ? {
            startTime: dayjs("09:00", "HH:mm"),
            endTime: dayjs("21:00", "HH:mm"),
          }
        : {
            startTime: dayjs(FULL_DAY_START, "HH:mm"),
            endTime: dayjs(FULL_DAY_END, "HH:mm"),
          };
      return {
        ...prev,
        [day]: { ...current, ...next, enabled: true },
      };
    });
  };

  // 🔹 Open every day, around the clock
  const handleOpen247 = () => {
    setWorkingDays((prev) =>
      daysOfWeek.reduce(
        (acc, day) => ({
          ...acc,
          [day]: {
            ...prev[day],
            enabled: true,
            startTime: dayjs(FULL_DAY_START, "HH:mm"),
            endTime: dayjs(FULL_DAY_END, "HH:mm"),
          },
        }),
        {}
      )
    );
  };

  const allDaysAre247 = daysOfWeek.every(
    (day) => workingDays[day].enabled && isFullDay(workingDays[day])
  );

  // 🔹 Handle time changes for a day
  const handleTimeChange = (day, key, time) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: time },
    }));
  };

  // 🔹 Generate final output whenever state changes
  useEffect(() => {
    const activeDays = Object.entries(workingDays)
      .filter(([_, data]) => data.enabled)
      .map(([day, data]) => ({
        dayNumber: dayToNumber[day],
        startTime: data.startTime ? data.startTime.format("HH:mm") : null,
        endTime: data.endTime ? data.endTime.format("HH:mm") : null,
      }));

    // 🔹 Group days with the same time range
    const groupedAvailabilities = [];
    activeDays.forEach(({ dayNumber, startTime, endTime }) => {
      let found = groupedAvailabilities.find(
        (group) => group.startTime === startTime && group.endTime === endTime
      );

      if (found) {
        found.days.push(dayNumber);
      } else {
        groupedAvailabilities.push({
          days: [dayNumber],
          startTime,
          endTime,
        });
      }
    });

    onChange(groupedAvailabilities); // 🔹 Send final data to parent
  }, [workingDays, onChange]);

  // Rebuilt each render so the live clock beside each zone stays current.
  const timeZoneOptions = useMemo(
    () =>
      timeZones.map((tz) => {
        const offset = getOffsetLabel(tz.value);
        const now = getCurrentTime(tz.value);
        return {
          value: tz.value,
          searchtext: searchTextFor(tz),
          // Collapsed label once chosen — the dropdown row is richer.
          selectedlabel: `${tz.city} · ${offset}`,
          label: (
            <div className="tz-option">
              <span className="tz-option__city">{tz.city}</span>
              <span className="tz-option__country">{tz.country}</span>
              <span className="tz-option__meta">
                {now} · {offset}
              </span>
            </div>
          ),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clockTick]
  );

  return (
    <div className="working-hours">
      <div className="working-hours-head">
        <h5 className="working-hours-title">{title}</h5>
        <h6 className="description">{t("working_hours.select_days_hours")}</h6>
      </div>

      <div className="branch-working-hours-inputs working-hours-body">
        {/* Time Zone Selector */}
        <Form.Item
          rules={[
            { required: true, message: t("working_hours.timezone_required") },
          ]}
          name="zone"
          label={t("working_hours.timezone")}
        >
          <Select
            showSearch
            // People search by the city they are in, not by the IANA id or the
            // standards name, so match against every city the zone covers.
            filterOption={(input, option) =>
              (option?.searchtext || "").includes(input.trim().toLowerCase())
            }
            optionLabelProp="selectedlabel"
            placeholder={t("working_hours.timezone_placeholder")}
            options={timeZoneOptions}
          />
        </Form.Item>

        {/* One tap for venues that never close, instead of setting the same
            24-hour window on seven rows by hand. */}
        <div className="working-hours-quick">
          <Button
            size="small"
            type={allDaysAre247 ? "primary" : "default"}
            onClick={handleOpen247}
            className="open-247-btn"
          >
            {t("working_hours.open_247")}
          </Button>
        </div>

        {/* Grid Container for Working Days */}
        <div className="days-grid">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className={`day-row${
                workingDays[day].enabled ? " is-on" : " is-off"
              }`}
            >
              <Switch
                size="small"
                checked={workingDays[day].enabled}
                onChange={(checked) => handleSwitchChange(day, checked)}
              />
              <span className="day-label">
                {t(`working_hours.days.${day.toLowerCase()}`)}
              </span>
              {isFullDay(workingDays[day]) && workingDays[day].enabled ? (
                // The pickers would both read 00:00, which looks like a
                // mistake rather than "open all day".
                <Tag className="full-day-tag" color="success">
                  {t("working_hours.all_day")}
                </Tag>
              ) : (
                <>
                  <TimePicker
                    size="middle"
                    value={workingDays[day].startTime}
                    onChange={(time) => handleTimeChange(day, "startTime", time)}
                    format="HH:mm"
                    disabled={!workingDays[day].enabled}
                  />
                  <span className="to-text">{t("working_hours.to")}</span>
                  <TimePicker
                    size="middle"
                    value={workingDays[day].endTime}
                    onChange={(time) => handleTimeChange(day, "endTime", time)}
                    format="HH:mm"
                    disabled={!workingDays[day].enabled}
                  />
                </>
              )}
              <Button
                size="small"
                type={isFullDay(workingDays[day]) ? "primary" : "default"}
                onClick={() => handleFullDayToggle(day)}
                className="full-day-btn"
              >
                {t("working_hours.hours_24")}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
