import { StyleProp, ViewStyle } from "react-native";
import { DateData } from "react-native-calendars";

export type CalendarAvailabilityProps = {
  bookedDays?: number[];
  overrideContainerStyle?: StyleProp<ViewStyle>;
  onMonthChange?: (date: Date) => void;
  isLoading?: boolean;
  calendarBackgroundColor?: string;
  onDayPress?: (date: DateData) => void;
  showInfo?: boolean;
  selectedDate?: Date;
};
