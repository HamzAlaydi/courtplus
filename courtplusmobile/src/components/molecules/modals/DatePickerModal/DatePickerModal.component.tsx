import React from "react";
import DatePicker from "react-native-date-picker";
import { DatePickerModalProps } from "./DatePickerModal.types";
import { isRTL } from "utils";
import { useTranslation } from "react-i18next";

// Reasonable lower bound for a date of birth.
const MINIMUM_DATE_OF_BIRTH = new Date(1920, 0, 1);

// Matches the backend rule (@MaxDate: today - 14 years on dateOfBirth).
const getMaximumDateOfBirth = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 14);
  return date;
};

const DatePickerModal = ({
  isOpen,
  date,
  onConfirm,
  onCancel,
}: DatePickerModalProps) => {
  const { t } = useTranslation();
  return (
    <DatePicker
      title={null}
      modal
      open={isOpen}
      date={date}
      onConfirm={onConfirm}
      onCancel={onCancel}
      mode="date"
      minimumDate={MINIMUM_DATE_OF_BIRTH}
      maximumDate={getMaximumDateOfBirth()}
      confirmText={t("general.confirm")}
      cancelText={t("general.cancel")}
      locale={isRTL ? "ar" : "en"}
    />
  );
};

export default DatePickerModal;
