import { CustomButton, CustomText, LanguageIcon } from "atoms/index";
import {
  GenderController,
  Header,
  InputController,
  OnboardingFooter,
  DateOfBirthController,
  MobileController,
} from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./Register.styles";
import { useThemeContext } from "contexts";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { useRegister } from "./Register.logic";

const RegisterScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { methods, onSubmit, errors, goBack } = useRegister();
  const { t } = useTranslation();

  return (
    <MainWrapper overrideContainerStyle={themedStyles.container} scrollEnabled>
      <Header
        leadingComponent={
          <Image source={Images.horizontalLogo} style={themedStyles.logo} />
        }
        trailingComponent={<LanguageIcon />}
      />
      <CustomText
        text={t("auth.signUp")}
        font="headline1"
        weight="semiBold"
        overrideStyle={themedStyles.title}
      />
      <FormProvider {...methods}>
        <View style={themedStyles.formContainer}>
          <InputController
            name="fullName"
            label={t("general.fullName")}
            errorText={errors.fullName?.message}
          />
          <InputController
            name="username"
            label={t("general.username")}
            errorText={errors.username?.message}
          />
          <MobileController
            name="phoneNumber"
            label={t("general.mobileNumber")}
            errorText={errors.phoneNumber?.message}
          />

          <View style={themedStyles.dateOfBirthContainer}>
            <DateOfBirthController
              name="dateOfBirth"
              label={t("general.dateBirth")}
              overrideStyle={themedStyles.input}
            />
            <GenderController
              name="gender"
              label={t("general.gender")}
              overrideStyle={themedStyles.input}
            />
          </View>
        </View>
      </FormProvider>
      <CustomButton
        title={t("auth.signUp")}
        onPress={methods.handleSubmit(onSubmit)}
        variant={!methods.formState.isValid ? "bordered" : "active"}
        overrideStyle={themedStyles.button}
        disabled={!methods.formState.isValid}
      />
      <OnboardingFooter
        overrideStyle={themedStyles.footer}
        onPress={goBack}
        type="register"
      />
    </MainWrapper>
  );
};

export default RegisterScreen;
