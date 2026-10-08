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
import FocusAwareStatusBar from "atoms/FocusAwareStatusBar/FocusAwareStatusBar.component";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useDisableBackHandler } from "hooks";
import { useCompleteProfile } from "./CompleteProfile.logic";
import { enterDrop, enterRise, generateFullName } from "utils";

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
    <>
      <FocusAwareStatusBar barStyle="dark-content" />
      <MainWrapper
        scrollEnabled
        enableSafeArea
        overrideContentStyle={themedStyles.content}
      >
        <Animated.View entering={enterDrop(0)}>
          <CustomText
            text={t("completeProfile.title")}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
        </Animated.View>
        {isFetching ? (
          <SkeletonLoader />
        ) : (
          <>
            <Animated.View entering={enterRise(1)}>
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
                font="cardTitle"
                weight="bold"
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
            </Animated.View>
            <Animated.View entering={enterRise(2)}>
              <TextArea
                label={t("general.bio")}
                value={bio}
                maxLength={120}
                placeholder={t("completeProfile.bioPlaceholder")}
                onChangeText={onBioChange}
                overrideStyle={themedStyles.bio}
              />
            </Animated.View>
            <View style={themedStyles.divider} />
            <Animated.View entering={enterRise(3)}>
              <SportsLevelManager
                sports={data?.sports ?? []}
                isCompleteProfile
              />
            </Animated.View>
            <View style={themedStyles.buttonContainer}>
              <CustomButton
                title={t("general.skip")}
                variant="outline"
                onPress={onSkipPress}
                overrideStyle={themedStyles.button}
              />
              <CustomButton
                title={t("general.done")}
                onPress={onDone}
                variant="primary"
                overrideStyle={themedStyles.button}
              />
            </View>
          </>
        )}
      </MainWrapper>
    </>
  );
};

export default CompleteProfileScreen;
