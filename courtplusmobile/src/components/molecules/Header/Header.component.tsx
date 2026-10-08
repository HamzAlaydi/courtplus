import { BackButton, CustomText } from "atoms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import styles from "./Header.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderProps } from "./Header.types";
import { useThemeContext } from "contexts";
import { verticalScale } from "utils";

const Header = ({
  leadingComponent,
  trailingComponent,
  leadingComponentStyle,
  trailingComponentStyle,
  whiteColor = false,
  title,
  overrideBackButtonStyle,
  overrideTitleStyle,
  showBackButton = true,
  overrideTitleContainerStyle,
  overrideStyle,
}: HeaderProps) => {
  const { top } = useSafeAreaInsets();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <View
      style={[
        themedStyles.container,
        { paddingTop: top + verticalScale(8) },
        overrideStyle,
      ]}
    >
      {showBackButton && (
        <BackButton
          whiteColor={whiteColor}
          overrideStyle={overrideBackButtonStyle}
        />
      )}
      {leadingComponent && (
        <View style={leadingComponentStyle}>{leadingComponent}</View>
      )}
      {title ? (
        <View
          style={[themedStyles.titleContainer, overrideTitleContainerStyle]}
        >
          <CustomText
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            accessibilityRole="header"
            text={title}
            font="screenTitle"
            weight="extraBold"
            overrideStyle={[themedStyles.title, overrideTitleStyle]}
          />
        </View>
      ) : (
        !!trailingComponent && <View style={themedStyles.titleContainer} />
      )}

      {trailingComponent && (
        <View style={trailingComponentStyle}>{trailingComponent}</View>
      )}
    </View>
  );
};

export default Header;
