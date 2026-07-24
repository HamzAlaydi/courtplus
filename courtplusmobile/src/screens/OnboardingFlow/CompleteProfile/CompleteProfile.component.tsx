import {
  CustomButton,
  CustomText,
  SkeletonLoader,
  TextArea,
} from "atoms/index";
import { useThemeContext } from "contexts";
import {
  MainWrapper,
  ProfileImageHeader,
  SportsLevelManager,
} from "organisms/index";
import React, { useMemo } from "react";
import styles from "./CompleteProfile.styles";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { useDisableBackHandler } from "hooks";
import { useCompleteProfile } from "./CompleteProfile.logic";
import { generateFullName } from "utils";

const CompleteProfileScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  useDisableBackHandler();
  const { data, isFetching, onSkipPress, onBioChange, bio, onDone } =
    useCompleteProfile();

  return (
    <MainWrapper
      whiteBackground
      scrollEnabled
      enableSafeArea
      overrideContainerStyle={themedStyles.container}
      overrideContentStyle={themedStyles.content}
    >
      <CustomText
        text={t("completeProfile.title")}
        font="headline1"
        weight="semiBold"
        overrideStyle={themedStyles.title}
      />
      {isFetching ? (
        <SkeletonLoader />
      ) : (
        <>
          <ProfileImageHeader
            user={data ?? null}
            showUpdateButton={false}
            overrideStyle={themedStyles.header}
            showFollowersAndFollowing={false}
            isUpdating
            isCompleteProfile
          />

          <CustomText
            text={generateFullName(data ?? { firstName: "", lastName: "" })}
            font="fields"
            weight="semiBold"
            overrideStyle={themedStyles.fullName}
          />
          {data?.username && (
            <CustomText
              font="headline3"
              weight="medium"
              text={`@${data?.username}`}
              overrideStyle={themedStyles.username}
            />
          )}
          <TextArea
            label={t("general.bio")}
            value={bio}
            maxLength={120}
            placeholder={t("completeProfile.bioPlaceholder")}
            onChangeText={onBioChange}
            overrideStyle={themedStyles.bio}
          />
          <View style={themedStyles.divider} />
          <SportsLevelManager sports={data?.sports ?? []} isCompleteProfile />
          <View style={themedStyles.buttonContainer}>
            <CustomButton
              title={t("general.skip")}
              variant="bordered"
              onPress={onSkipPress}
              overrideStyle={themedStyles.skipButton}
              overrideTextStyle={themedStyles.buttonText}
            />
            <CustomButton
              title={t("general.done")}
              onPress={onDone}
              variant="dark"
              overrideStyle={themedStyles.button}
            />
          </View>
        </>
      )}
    </MainWrapper>
  );
};

export default CompleteProfileScreen;
