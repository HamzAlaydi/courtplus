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

// Helper function to check if selected slots are continuous
const areSlotsContinuous = (slots) => {
  if (slots.length <= 1) return true;

  // Sort slots by start time
  const sortedSlots = slots
    .map((slot) => {
      const [start, end] = slot.split("-");
      return { start, end };
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  // Check if each slot's end time matches the next slot's start time
  for (let i = 0; i < sortedSlots.length - 1; i++) {
    if (sortedSlots[i].end !== sortedSlots[i + 1].start) {
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

  // Sort slots by start time
  const sortedSlots = timeSlots
    .map((slot) => {
      // "YYYY-MM-DD|HH:mm-HH:mm"; the date half is absent on older payloads.
      const [slotDate, range] = slot.includes("|")
        ? slot.split("|")
        : ["", slot];
      const [start, end] = range.split("-");
      return { slotDate, start, end };
    })
    .sort((a, b) =>
      `${a.slotDate} ${a.start}`.localeCompare(`${b.slotDate} ${b.start}`)
    );

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
          value={formData.branch}
          onChange={onBranchChange}
          style={{ width: "48%" }}
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
          value={formData.court}
          onChange={onCourtChange}
          style={{ width: "48%" }}
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
      <BookingCalendar
        value={formData.date}
        onChange={onDayChange}
        availability={monthAvailability}
        onMonthChange={onMonthDay}
      />
    </div>,

    // Step 1: Select time
    <div className="step step-1">
      <h4>
        {formData.date ? dayjs(formData.date).format("DD MMMM YYYY") : ""}
      </h4>
      <p style={{ color: "#999", marginBottom: 8 }}>Booking time</p>

      {isLoadingData ? (
        <p>Loading time slots...</p>
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
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No availability"
                  style={{ marginTop: 20 }}
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
                <Button
                  key={slotKey}
                  onClick={handleToggleSlot}
                  disabled={isBooked}
                  type={isSelected ? "primary" : "default"}
                  style={{
                    margin: 6,
                    backgroundColor: isBooked ? "#00c46c" : undefined,
                    color: isBooked ? "#fff" : undefined,
                    borderRadius: 12,
                    minWidth: 70,
                    fontSize: "1.2rem",
                  }}
                >
                  {slot.startTime} - {slot.endTime}
                </Button>
              );
            };

            return (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    🟢 Morning
                  </div>
                  <div>{morningSlots.map(renderSlot)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>🟢 Day</div>
                  <div>{daySlots.map(renderSlot)}</div>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 16,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        background: "#00c46c",
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        marginRight: 4,
                      }}
                    />
                    Booked
                  </div>
                  <div>
                    <span
                      style={{
                        border: "1px solid #ccc",
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        marginRight: 4,
                      }}
                    />
                    Available
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>,

    // Step 2: Confirm
    <div className="step step-2">
      <div style={{ marginBottom: 12 }}>
        <CalendarOutlined /> <strong>Date:</strong>{" "}
        {dayjs(formData.date).format("DD MMM YYYY")}
      </div>
      <div style={{ marginBottom: 12 }}>
        <ClockCircleOutlined /> <strong>Time:</strong>{" "}
        {formData.time?.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {formData.time
              .slice()
              .sort((a, b) => {
                const [aH, aM] = a.split("-")[0].split(":").map(Number);
                const [bH, bM] = b.split("-")[0].split(":").map(Number);
                return aH * 60 + aM - (bH * 60 + bM);
              })
              .map((slot, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#f8f8f8",
                    border: "1px solid #ccc",
                    fontSize: 14,
                  }}
                >
                  {slot}
                </span>
              ))}
          </div>
        ) : (
          <span style={{ marginLeft: 8 }}>No slots selected</span>
        )}
      </div>
      <strong>Participants: </strong> <br />
      <div className="user-confirm">
        <CustomersSelect onChange={handleParticipantsChange} />
      </div>
      <Radio.Group
        value={formData.method}
        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
        style={{ marginTop: 12 }}
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
      width={600}
      className="booking-modal"
    >
      {isLoadingData && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
        >
          <Spin
            style={{
              zIndex: 11,
            }}
            spinning={isLoadingData}
            tip="Loading..."
            size="large"
          />
        </div>
      )}
      <h2>New Book</h2>
      <Steps size="small" current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="Select Date" />
        <Step title="Choose Time" />
        <Step title="Confirm" />
      </Steps>
      {stepContent[currentStep]}
      <div
        className="footer-btns"
        style={{ marginTop: 24, textAlign: "right" }}
      >
        {currentStep > 0 && (
          <Button onClick={prev} style={{ marginRight: 8 }}>
            Back
          </Button>
        )}
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
            onClick={handleSubmit}
            style={{ background: "#C5FF3D", border: "none" }}
          >
            Book now
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default BookingModal;
