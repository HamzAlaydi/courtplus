import { CustomButton, CustomText, SkeletonLoader } from "atoms/index";
import { Header, MobileController } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterRise } from "utils";
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
    <MainWrapper>
      <Header whiteColor title={t("settings.changePhoneNumber")} />
      {isLoading && <SkeletonLoader />}
      {!isLoading && (
        <View style={themedStyles.content}>
          <Animated.View entering={enterRise(0)} style={themedStyles.card}>
            <View style={themedStyles.intro}>
              <View style={themedStyles.iconBadge}>
                <Image source={Images.phone} style={themedStyles.icon} />
              </View>
              <CustomText
                text={t("changePhone.title")}
                font="cardTitle"
                weight="bold"
                accessibilityRole="header"
                overrideStyle={themedStyles.title}
              />
            </View>
            <FormProvider {...methods}>
              <MobileController
                name="phoneNumber"
                greyBackground
                label={t("general.mobileNumber")}
                overrideStyle={themedStyles.input}
                phoneNumber={phoneNumber}
              />
            </FormProvider>
          </Animated.View>
          <Animated.View entering={enterRise(1)}>
            <CustomButton
              onPress={methods.handleSubmit(onSubmit)}
              variant={isDisabled ? "disabledDark" : "primary"}
              disabled={isDisabled}
              title={t("general.continue")}
              overrideStyle={themedStyles.button}
            />
          </Animated.View>
        </View>
      )}
    </MainWrapper>
  );
};

export default ChangePhoneScreen;
