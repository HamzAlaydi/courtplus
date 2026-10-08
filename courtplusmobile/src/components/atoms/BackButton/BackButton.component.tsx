import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image } from "react-native";
import { Images } from "theme";
import styles from "./BackButton.styles";
import { BackButtonProps } from "./BackButton.types";
import PressableScale from "atoms/PressableScale/PressableScale.component";
import { useTranslation } from "react-i18next";

const BackButton = ({
  whiteColor = false,
  overrideStyle,
  iconStyle,
}: BackButtonProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const { goBack } = useNavigation();
  const { t } = useTranslation();
  const themedStyles = useMemo(
    () => styles(colors, whiteColor),
    [colors, whiteColor]
  );

  return (
    <PressableScale
      style={[themedStyles.container, overrideStyle]}
      onPress={goBack}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={t("general.back")}
    >
      <Image
        source={Images.arrowLeft}
        style={[themedStyles.image, iconStyle]}
      />
    </PressableScale>
  );
};

export default BackButton;
