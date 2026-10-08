export type HomeQuickActionKey =
  | "courts"
  | "bookings"
  | "openMatch"
  | "coaches";

export type HomeQuickAction = {
  key: HomeQuickActionKey;
  title: string;
  onPress: () => void;
};
