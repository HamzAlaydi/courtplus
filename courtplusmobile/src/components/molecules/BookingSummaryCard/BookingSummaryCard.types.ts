import { Booking } from "models";

export type BookingSummaryCardProps = {
  item: Booking;
  onPress: () => void;
  profileId: string;
};
