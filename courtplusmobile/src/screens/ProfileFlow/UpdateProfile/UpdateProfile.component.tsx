import { useThemeContext } from "contexts";
import {
  DateOfBirthController,
  GenderController,
  Header,
  InputController,
  TextAreaController,
} from "molecules/index";
import {
  MainWrapper,
  ProfileImageHeader,
  SportsLevelManager,
} from "organisms/index";
import React, { useMemo } from "react";
import styles from "./UpdateProfile.styles";
import { FormProvider } from "react-hook-form";
import { View } from "react-native";
import { CustomButton } from "atoms/index";
import Animated from "react-native-reanimated";
import { enterDrop, enterRise } from "utils";
import { useUpdateProfile } from "./UpdateProfile.logic";
import { useTranslation } from "react-i18next";

const UpdateProfileScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { user, methods, isValid, onSubmit } = useUpdateProfile();
  const { t } = useTranslation();

  const errors = methods.formState.errors;

  return (
    <MainWrapper scrollEnabled overrideContentStyle={themedStyles.content}>
      <Header
        whiteColor
        title={t("profile.updateProfile")}
        trailingComponent={
          <CustomButton
            title={t("general.save")}
            onPress={methods.handleSubmit(onSubmit)}
            disabled={!isValid}
            size="small"
            variant={isValid ? "primary" : "disabledDark"}
            overrideStyle={themedStyles.save}
          />
        }
      />
      <Animated.View entering={enterDrop(0)}>
        <ProfileImageHeader
          user={user}
          showFollowersAndFollowing={false}
          overrideStyle={themedStyles.profileImageHeader}
          showUpdateButton={false}
          isUpdating
        />
      </Animated.View>
      <Animated.View entering={enterRise(1)} style={themedStyles.mainContent}>
        <FormProvider {...methods}>
          <InputController
            name="fullName"
            label={t("general.fullName")}
            overrideStyle={themedStyles.fullName}
            greyBackground
            errorText={errors.fullName?.message}
          />
          <InputController
            name="username"
            label={t("general.username")}
            overrideStyle={themedStyles.username}
            greyBackground
            errorText={errors.username?.message}
          />
          <View style={themedStyles.dateOfBirthContainer}>
            <DateOfBirthController
              name="dateOfBirth"
              label={t("general.dateBirth")}
              greyBackground
              overrideStyle={themedStyles.flexOne}
            />
            <GenderController
              name="gender"
              label={t("general.gender")}
              greyBackground
              overrideStyle={themedStyles.flexOne}
              selectedGender={user?.gender}
            />
          </View>
          <TextAreaController
            name="bio"
            label={t("general.bio")}
            overrideStyle={themedStyles.bio}
          />
        </FormProvider>
        <View style={themedStyles.divider} />
        <SportsLevelManager sports={user?.sports ?? []} />
      </Animated.View>
    </MainWrapper>
  );
};

export default UpdateProfileScreen;
