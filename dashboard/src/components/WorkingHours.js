import React, { useState, useEffect } from "react";
import { Form, Switch, TimePicker, Select } from "antd";
import dayjs from "dayjs";
import { timeZones } from "../modules/timeZones";
import { useTranslation } from "react-i18next";

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

  return (
    <div className="working-hours">
      <h5>{title}</h5>
      <h6 className="description">{t("working_hours.select_days_hours")}</h6>

      <div className="branch-working-hours-inputs">
        {/* Time Zone Selector */}
        <Form.Item
          rules={[
            { required: true, message: t("working_hours.timezone_required") },
          ]}
          name="zone"
          label={t("working_hours.timezone")}
        >
          <Select
            defaultValue={initialSchedule?.timeZone}
            placeholder="Time Zone"
          >
            {timeZones.map((tz) => (
              <Select.Option key={tz.value} value={tz.value}>
                {tz.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Grid Container for Working Days */}
        <div className="days-grid">
          {daysOfWeek.map((day) => (
            <div key={day} className="day-row">
              <Switch
                size="small"
                checked={workingDays[day].enabled}
                onChange={(checked) => handleSwitchChange(day, checked)}
              />
              <span className="day-label">
                {t(`working_hours.days.${day.toLowerCase()}`)}
              </span>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
