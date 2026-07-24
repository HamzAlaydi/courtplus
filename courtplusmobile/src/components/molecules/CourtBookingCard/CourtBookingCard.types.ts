import { Court, User } from "models";

export type CourtBookingCardProps = {
  courtData: Court;
  selectedDate: Date;
  selectedTime: string;
  participants: User[];
  showRemoveButton?: boolean;
};
