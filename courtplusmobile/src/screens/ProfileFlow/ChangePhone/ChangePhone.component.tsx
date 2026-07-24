import { CustomButton, CustomText, SkeletonLoader } from "atoms/index";
import { Header, MobileController } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useChangePhone } from "./ChangePhone.logic";
import { useThemeContext } from "contexts";
import styles from "./ChangePhone.styles";

const ChangePhoneScreen = () => {
  const { t } = useTranslation();
  const { methods, isDisabled, onSubmit, phoneNumber, isLoading } =
    useChangePhone();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <MainWrapper whiteBackground>
      <Header whiteColor title={t("settings.changePhoneNumber")} />
      {isLoading && <SkeletonLoader />}
      {!isLoading && (
        <View style={themedStyles.content}>
          <CustomText
            text={t("changePhone.title")}
            font="headline1"
            weight="bold"
          />
          <FormProvider {...methods}>
            <MobileController
              name="phoneNumber"
              greyBackground
              label={t("general.mobileNumber")}
              overrideStyle={themedStyles.input}
              phoneNumber={phoneNumber}
            />
          </FormProvider>
          <CustomButton
            onPress={methods.handleSubmit(onSubmit)}
            variant={isDisabled ? "disabledDark" : "dark"}
            disabled={isDisabled}
            title={t("general.continue")}
            overrideStyle={themedStyles.button}
          />
        </View>
      )}
    </MainWrapper>
  );
};

export default ChangePhoneScreen;
