export type DatePickerModalProps = {
  isOpen: boolean;
  date: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};
