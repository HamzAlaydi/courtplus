import React, { useState } from "react";
import {
  Modal,
  Steps,
  Select,
  Button,
  Radio,
  message,
  Empty,
  Spin,
} from "antd";
import {
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../../actions/branch_action";
import { getCourtAvailabilty, getCourts } from "../../actions/court_actions";
import BookingCalendar from "./BookingCalendar";
import { createMatch } from "../../actions/match_actions";
import { useNotification } from "../../modules/NotificationProvider";
import CustomersSelect from "./CustomersSelect";

const { Step } = Steps;
const { Option } = Select;

const branchParams = {
  page: 1,
  pageSize: 100,
  search: null,
  placeId: null,
  lat: null,
  lng: null,
  radius: null,
};

// Slot keys are "YYYY-MM-DD|HH:mm-HH:mm"; the date half is absent on older
// payloads. Splitting the whole key on "-" cut through the date instead.
const parseSlotKey = (slot) => {
  const [slotDate, range] = slot.includes("|") ? slot.split("|") : ["", slot];
  const [start, end] = range.split("-");
  return { slotDate, range, start, end };
};

const compareSlots = (a, b) =>
  `${a.slotDate} ${a.start}`.localeCompare(`${b.slotDate} ${b.start}`);

// Helper function to check if selected slots are continuous
const areSlotsContinuous = (slots) => {
  if (slots.length <= 1) return true;

  // Sort slots by date, then start time
  const sortedSlots = slots.map(parseSlotKey).sort(compareSlots);

  // Each slot must be on the same date as the next one and end when it starts
  for (let i = 0; i < sortedSlots.length - 1; i++) {
    const current = sortedSlots[i];
    const following = sortedSlots[i + 1];
    if (
      current.slotDate !== following.slotDate ||
      current.end !== following.start
    ) {
      return false;
    }
  }
  return true;
};

// Helper function to calculate duration and start time from slots
const calculateBookingDetails = (date, timeSlots) => {
  if (!date || !timeSlots || timeSlots.length === 0) {
    return { startAt: null, duration: 0 };
  }

  // Sort slots by date, then start time
  const sortedSlots = timeSlots.map(parseSlotKey).sort(compareSlots);

  // Start from the slot's OWN date so a post-midnight slot books the right
  // night, falling back to the selected day when the API did not send one.
  const firstSlot = sortedSlots[0];
  const startDate = firstSlot.slotDate || dayjs(date).format("YYYY-MM-DD");
  const startAt = `${startDate} ${firstSlot.start}`;

  // Calculate total duration in minutes
  let duration = 0;
  sortedSlots.forEach((slot) => {
    const start = dayjs(`2023-01-01 ${slot.start}`); // Arbitrary date for time calc
    const end = dayjs(`2023-01-01 ${slot.end}`);
    duration += end.diff(start, "minute");
  });

  return { startAt, duration };
};

const BookingModal = ({ open, onClose }) => {
  const notify = useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [viewedMonth, setViewedMonth] = useState(dayjs().format("YYYY-MM"));
  const [selectedDay, setSelectedDay] = useState([]);

  const [courtsData, setCourtsData] = useState(null);
  const [monthAvailability, setMonthAvailability] = useState(null);
  const [dayAvailability, setDayAvailability] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    branch: null,
    court: null,
    date: null,
    time: [],
    email: "",
    participants: [],
    method: "call",
  });

  // 🔹 Fetch branches with applied filters
  const {
    isLoading,
    data: branchData,
    refetch: refetchBranches,
  } = useQuery({
    queryKey: ["branches", branchParams],
    queryFn: () => getBranches(branchParams),
    keepPreviousData: true,
  });

  const onBranchChange = async (value) => {
    setFormData({ ...formData, branch: value, court: null });
    setSelectedBranchId(value);
    setSelectedCourtId(null);
    setMonthAvailability(null);

    setIsLoadingData(true);

    getCourts({ branchId: value })
      .then((courtsRes) => {
        setCourtsData(courtsRes);
      })
      .catch(() => {
        setCourtsData(null);
      });
    setIsLoadingData(false);
  };

  const onCourtChange = (value) => {
    setFormData({ ...formData, court: value });
    setSelectedCourtId(value);
    setIsLoadingData(true);

    getCourtAvailabilty({ courtId: value, params: { month: viewedMonth } })
      .then((monthRes) => {
        setMonthAvailability(monthRes);
      })
      .catch(() => {
        setMonthAvailability(null);
      });
    setIsLoadingData(false);
  };

  const onDayChange = (date) => {
    setFormData({ ...formData, date });
    const day = dayjs(date).format("YYYY-MM-DD");

    if (!selectedCourtId || !date) return;

    setIsLoadingData(true);
    getCourtAvailabilty({
      courtId: selectedCourtId,
      params: { date: day },
    })
      .then((res) => {
        setDayAvailability(res);
        setSelectedDay(day);
      })
      .catch(() => {
        setDayAvailability(null);
      });
    setIsLoadingData(false);
  };

  const onMonthDay = (month) => {
    setViewedMonth(month);

    if (selectedCourtId) {
      setIsLoadingData(true);
      // Two bugs here: the action destructures `courtId` (not
      // `selectedCourtId`), so the request went out without a court and
      // failed; and a MONTH response was written into the day slots, wiping
      // the time list. Month results belong in monthAvailability.
      getCourtAvailabilty({
        courtId: selectedCourtId,
        params: { month },
      })
        .then((res) => {
          setMonthAvailability(res);
        })
        .catch(() => {
          setMonthAvailability(null);
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    }
  };

  const handleParticipantsChange = (values) => {
    console.log(values);
    setFormData({ ...formData, participants: values });
  };

  const splitTimeSlots = (slots) => {
    const morning = [];
    const day = [];

    slots?.forEach((slot) => {
      const hour = parseInt(slot.startTime.split(":")[0], 10);
      if (hour < 12) {
        morning.push(slot);
      } else {
        day.push(slot);
      }
    });

    return { morningSlots: morning, daySlots: day };
  };

  const next = () => {
    if (currentStep === 0 && !formData.date)
      return message.error("Please select a date");
    if (currentStep === 1 && formData.time.length === 0)
      return message.error("Please select at least one time slot");
    setCurrentStep((prev) => prev + 1);
  };

  const prev = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = () => {
    // Transform formData to the required format
    const { startAt, duration } = calculateBookingDetails(
      formData.date,
      formData.time
    );

    const bookingData = {
      courtId: formData.court, // Assuming formData.court is the UUID
      startAt,
      duration,
      participants: formData.participants,
      open: false,
      paymentType: "whole",
      playerAside: formData.participants?.length,
      level: "intermediate",
      gender: "male",
    };

    createMatch(bookingData)
      .then(() => {
        refetchBranches();
        notify("success", "Match has been booked successfully");
        onClose();
      })
      .catch((err) => {
        console.log("Booking error:", err);
        notify("error", "Something went wrong!");
      });
  };

  const stepContent = [
    // Step 0: Select branch, court, and date
    <div className="step step-0">
      <div className="selectors">
        <Select
          className="booking-select"
          value={formData.branch}
          onChange={onBranchChange}
          placeholder="Select Branch"
          loading={isLoading}
          suffixIcon={<EnvironmentOutlined />}
        >
          {(branchData?.items || []).map((branch) => (
            <Option key={branch.id} value={branch.id}>
              {branch.name}
            </Option>
          ))}
        </Select>

        <Select
          className="booking-select"
          value={formData.court}
          onChange={onCourtChange}
          placeholder="Select Court"
          disabled={!selectedBranchId || isLoadingData}
          loading={isLoadingData}
          suffixIcon={<CheckCircleOutlined />}
        >
          {(courtsData?.items || []).map((court) => (
            <Option key={court.id} value={court.id}>
              {court.name}
            </Option>
          ))}
        </Select>
      </div>
      <div className="booking-calendar-panel">
        <BookingCalendar
          value={formData.date}
          onChange={onDayChange}
          availability={monthAvailability}
          onMonthChange={onMonthDay}
        />
      </div>
    </div>,

    // Step 1: Select time
    <div className="step step-1">
      <div className="step-heading">
        <h4 className="step-date">
          {formData.date ? dayjs(formData.date).format("DD MMMM YYYY") : ""}
        </h4>
        <p className="step-caption">Booking time</p>
      </div>

      {isLoadingData ? (
        <p className="step-caption">Loading time slots...</p>
      ) : (
        <>
          {(() => {
            const { morningSlots, daySlots } = splitTimeSlots(
              dayAvailability?.slots || []
            );
            const hasNoSlots =
              morningSlots.length === 0 && daySlots.length === 0;

            if (hasNoSlots) {
              return (
                <Empty
                  className="slots-empty"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No availability"
                />
              );
            }

            const renderSlot = (slot) => {
              // The API now tells us which calendar day each slot starts on.
              // Keying on the time alone meant a venue open past midnight had
              // two different slots share one key, and the booking was always
              // built on the opening day — booking the wrong night.
              const slotKey = `${slot.date ?? ""}|${slot.startTime}-${slot.endTime}`;
              const isSelected = formData.time.includes(slotKey);
              // The API returns `available` (see Slot in
              // backend/src/modules/courts/dto/slots-response.dto.ts). Reading
              // `isReserved` always yielded undefined, so every taken slot
              // looked free and staff could double-book a court.
              const isBooked = slot.available === false;

              const handleToggleSlot = () => {
                if (isBooked) return;

                setFormData((prev) => {
                  let updatedTimes;

                  if (isSelected) {
                    updatedTimes = prev.time.filter((t) => t !== slotKey);
                  } else {
                    updatedTimes = [...prev.time, slotKey];
                  }

                  if (!areSlotsContinuous(updatedTimes)) {
                    message.error(
                      "Please select continuous time slots (adjacent times only)."
                    );
                    return prev;
                  }

                  return { ...prev, time: updatedTimes };
                });
              };

              return (
                <button
                  type="button"
                  key={slotKey}
                  onClick={handleToggleSlot}
                  disabled={isBooked}
                  aria-pressed={isSelected}
                  className={`time-slot${isSelected ? " is-selected" : ""}${
                    isBooked ? " is-taken" : ""
                  }`}
                >
                  {slot.startTime} - {slot.endTime}
                </button>
              );
            };

            return (
              <>
                <div className="slot-group">
                  <div className="slot-group-title">
                    <span className="slot-group-dot" aria-hidden="true" />
                    Morning
                  </div>
                  <div className="slot-grid">
                    {morningSlots.map(renderSlot)}
                  </div>
                </div>
                <div className="slot-group">
                  <div className="slot-group-title">
                    <span className="slot-group-dot" aria-hidden="true" />
                    Day
                  </div>
                  <div className="slot-grid">{daySlots.map(renderSlot)}</div>
                </div>
                <div className="slot-legend">
                  <span className="slot-legend-item">
                    <span
                      className="slot-swatch slot-swatch--taken"
                      aria-hidden="true"
                    />
                    Booked
                  </span>
                  <span className="slot-legend-item">
                    <span
                      className="slot-swatch slot-swatch--free"
                      aria-hidden="true"
                    />
                    Available
                  </span>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>,

    // Step 2: Confirm
    <div className="step step-2">
      <div className="confirm-list">
        <div className="confirm-row">
          <span className="confirm-label">
            <CalendarOutlined /> <strong>Date:</strong>
          </span>
          <span className="confirm-value">
            {dayjs(formData.date).format("DD MMM YYYY")}
          </span>
        </div>
        <div className="confirm-row">
          <span className="confirm-label">
            <ClockCircleOutlined /> <strong>Time:</strong>
          </span>
          {formData.time?.length > 0 ? (
            <div className="confirm-slots">
              {formData.time
                .map(parseSlotKey)
                .sort(compareSlots)
                .map(({ slotDate, range }, idx) => (
                  <span key={idx} className="confirm-slot">
                    {slotDate ? `${slotDate} · ${range}` : range}
                  </span>
                ))}
            </div>
          ) : (
            <span className="confirm-value cp-muted">No slots selected</span>
          )}
        </div>
      </div>
      <div className="confirm-field">
        <strong className="confirm-field-label">Participants: </strong>
        <div className="user-confirm">
          <CustomersSelect onChange={handleParticipantsChange} />
        </div>
      </div>
      <Radio.Group
        className="booking-method"
        optionType="button"
        buttonStyle="solid"
        value={formData.method}
        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
      >
        <Radio value="call">Through call</Radio>
        <Radio value="walkin">Walk In</Radio>
      </Radio.Group>
    </div>,
  ];

  return (
    <Modal
      classNames="booking-modal"
      open={open}
      onCancel={onClose}
      footer={null}
      closable
      width={640}
      className="booking-modal"
      title="New Book"
    >
      {isLoadingData && (
        <div className="booking-modal-loading">
          <Spin spinning={isLoadingData} tip="Loading..." size="large" />
        </div>
      )}
      <Steps size="small" current={currentStep} className="booking-steps">
        <Step title="Select Date" />
        <Step title="Choose Time" />
        <Step title="Confirm" />
      </Steps>
      <div className="booking-step-body" key={currentStep}>
        {stepContent[currentStep]}
      </div>
      <div className="footer-btns">
        {currentStep > 0 && <Button onClick={prev}>Back</Button>}
        {currentStep < 2 ? (
          <Button
            disabled={!selectedCourtId || !selectedDay}
            type="primary"
            onClick={next}
          >
            Next
          </Button>
        ) : (
          <Button
            type="primary"
            className="cp-btn-display"
            onClick={handleSubmit}
          >
            Book now
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default BookingModal;
