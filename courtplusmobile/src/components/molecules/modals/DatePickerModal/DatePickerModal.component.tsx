import React from "react";
import DatePicker from "react-native-date-picker";
import { DatePickerModalProps } from "./DatePickerModal.types";
import { isRTL } from "utils";
import { useTranslation } from "react-i18next";

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
      maximumDate={new Date()}
      confirmText={t("general.confirm")}
      cancelText={t("general.cancel")}
      locale={isRTL ? "ar" : "en"}
    />
  );
};

export default DatePickerModal;
