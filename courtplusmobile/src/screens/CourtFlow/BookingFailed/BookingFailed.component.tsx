import { useNavigation } from "@react-navigation/native";
import { useDisableBackHandler } from "hooks";
import { StatusView } from "molecules/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Images } from "theme";

const BookingFailedScreen = () => {
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  useDisableBackHandler();

  return (
    <StatusView
      image={Images.openMatch}
      secondImage={Images.failed}
      title={t("booking.bookingFailed")}
      buttonTitle={t("booking.tryAgain")}
      onButtonPress={goBack}
    />
  );
};

export default BookingFailedScreen;
