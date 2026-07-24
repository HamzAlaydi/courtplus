import { StackActions, useNavigation } from "@react-navigation/native";
import { useDisableBackHandler } from "hooks";
import { StatusView } from "molecules/index";
import React from "react";
import { useTranslation } from "react-i18next";
import { Images } from "theme";

const BookingSuccessScreen = () => {
  const { t } = useTranslation();
  useDisableBackHandler();
  const { dispatch } = useNavigation();

  const onPress = () => {
    dispatch(StackActions.popToTop());
  };

  return (
    <StatusView
      image={Images.openMatch}
      secondImage={Images.success}
      title={t("booking.bookingSuccess")}
      buttonTitle={t("booking.okContinue")}
      onButtonPress={onPress}
    />
  );
};

export default BookingSuccessScreen;
