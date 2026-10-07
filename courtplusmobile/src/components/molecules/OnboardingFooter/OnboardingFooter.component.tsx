import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import styles from "./OnboardingFooter.styles";
import { OnboardingFooterProps } from "./OnboardingFooter.types";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { isAndroid } from "utils";
import { useOnBoardingFooter } from "./OnBoardingFooter.logic";

const OnboardingFooter = ({
  onPress,
  type,
  overrideStyle,
}: OnboardingFooterProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { description, buttonText, onGoogleLogin } = useOnBoardingFooter(type);
  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.orContainer}>
        <View style={themedStyles.divider} />
        <CustomText
          text={t("general.or")}
          font="headline3"
          overrideStyle={themedStyles.or}
        />
        <View style={themedStyles.divider} />
      </View>
      <View style={themedStyles.socialContainer}>
        <TouchableOpacity
          onPress={onGoogleLogin}
          style={themedStyles.socialButtonContainer}
        >
          <Image source={Images.google} style={themedStyles.socialButton} />
        </TouchableOpacity>
        {/* Sign in with Apple is not implemented yet (no onPress); a dead
            button is worse than none. App Store rule 4.8 requires it before
            an iOS release with Google sign-in — tracked in the readiness doc. */}
      </View>
      <Text style={themedStyles.footerText}>
        <CustomText
          text={description}
          overrideStyle={themedStyles.footerText1}
        />
        <CustomText
          text={buttonText}
          font="chip"
          weight="semiBold"
          overrideStyle={themedStyles.footerText2}
          onPress={onPress}
        />
      </Text>
    </View>
  );
};

export default OnboardingFooter;
