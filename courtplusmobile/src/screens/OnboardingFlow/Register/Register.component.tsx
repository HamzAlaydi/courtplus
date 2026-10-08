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
import Animated from "react-native-reanimated";
import styles from "./Register.styles";
import { useThemeContext } from "contexts";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { enterRise } from "utils";
import { useRegister } from "./Register.logic";

const RegisterScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { methods, onSubmit, errors, goBack } = useRegister();
  const { t } = useTranslation();

  const isFormValid = methods.formState.isValid;

  return (
    <MainWrapper overrideContainerStyle={themedStyles.container} scrollEnabled>
      <Header
        leadingComponent={
          <Image
            source={Images.horizontalLogo}
            style={themedStyles.logo}
            accessibilityIgnoresInvertColors
          />
        }
        trailingComponent={<LanguageIcon />}
      />
      <Animated.View entering={enterRise(0)}>
        <CustomText
          text={t("auth.signUp")}
          font="displayHero"
          weight="extraBold"
          accessibilityRole="header"
          overrideStyle={themedStyles.title}
        />
      </Animated.View>
      <FormProvider {...methods}>
        <Animated.View
          entering={enterRise(1)}
          style={themedStyles.formContainer}
        >
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
        </Animated.View>
      </FormProvider>
      <Animated.View entering={enterRise(2)}>
        <CustomButton
          title={t("auth.signUp")}
          onPress={methods.handleSubmit(onSubmit)}
          variant="primary"
          overrideStyle={[
            themedStyles.button,
            !isFormValid && themedStyles.buttonDisabled,
          ]}
          overrideTextStyle={!isFormValid && themedStyles.buttonDisabledText}
          disabled={!isFormValid}
        />
      </Animated.View>
      <Animated.View entering={enterRise(3)}>
        <OnboardingFooter
          overrideStyle={themedStyles.footer}
          onPress={goBack}
          type="register"
        />
      </Animated.View>
    </MainWrapper>
  );
};

export default RegisterScreen;
