import { BackButton, CustomText } from "atoms/index";
import React from "react";
import { View } from "react-native";
import styles from "./Header.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HeaderProps } from "./Header.types";

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
  return (
    <View style={[styles.container, { paddingTop: top }, overrideStyle]}>
      {showBackButton && (
        <BackButton
          whiteColor={whiteColor}
          overrideStyle={overrideBackButtonStyle}
        />
      )}
      {leadingComponent && (
        <View style={leadingComponentStyle}>{leadingComponent}</View>
      )}
      {title && (
        <View style={[styles.titleContainer, overrideTitleContainerStyle]}>
          <CustomText
            numberOfLines={1}
            text={title}
            font="title"
            weight="semiBold"
            overrideStyle={[overrideTitleStyle]}
          />
        </View>
      )}

      {trailingComponent && (
        <View style={trailingComponentStyle}>{trailingComponent}</View>
      )}
    </View>
  );
};

export default Header;
