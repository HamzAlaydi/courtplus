import { BackButton, CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import styles from "./Coaches.styles";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { enterDrop, enterRise, verticalScale } from "utils";

const CoachesScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const { top, bottom } = useSafeAreaInsets();

  return (
    <ImageBackground source={Images.coachesBg} style={themedStyles.container}>
      <Animated.View
        entering={enterDrop(0)}
        style={[themedStyles.topBar, { paddingTop: top + verticalScale(8) }]}
      >
        <BackButton whiteColor />
      </Animated.View>
      <View
        style={[
          themedStyles.content,
          { paddingBottom: bottom + verticalScale(28) },
        ]}
      >
        <Animated.View entering={enterRise(0)} style={themedStyles.badge}>
          <Image source={Images.whistle} style={themedStyles.badgeIcon} />
        </Animated.View>
        <Animated.View entering={enterRise(1)} style={themedStyles.copy}>
          <CustomText
            text={t("coaches.comingSoon")}
            font="displayHero"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          <CustomText
            text={t("coaches.description")}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.description}
          />
        </Animated.View>
        <Animated.View entering={enterRise(2)} style={themedStyles.buttonRow}>
          <CustomButton
            title={t("coaches.home")}
            onPress={goBack}
            variant="primary"
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

export default CoachesScreen;
