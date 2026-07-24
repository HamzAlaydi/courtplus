import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./Coaches.styles";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

const CoachesScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { goBack } = useNavigation();

  return (
    <ImageBackground source={Images.coachesBg} style={themedStyles.container}>
      <View style={themedStyles.content}>
        <CustomText
          text={t("coaches.comingSoon")}
          font="headline1"
          weight="bold"
        />
        <CustomText
          text={t("coaches.description")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
        />
        <CustomButton
          title={t("coaches.home")}
          onPress={goBack}
          variant="dark"
          overrideStyle={themedStyles.button}
        />
      </View>
    </ImageBackground>
  );
};

export default CoachesScreen;
