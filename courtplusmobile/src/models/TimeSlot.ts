export type Slot = {
  startTime: string;
  endTime: string;
  available: boolean;
};
export type TimeSlot = {
  label: string;
  time: Slot[];
};
