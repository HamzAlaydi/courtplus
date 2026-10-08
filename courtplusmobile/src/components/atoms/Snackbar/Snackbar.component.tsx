import React, { useEffect, useMemo, useRef } from "react";
import { Animated, TouchableOpacity, View, Image } from "react-native";
import { SnackbarProps } from "./Snackbar.types";
import styles from "./Snackbar.styles";
import { useThemeContext } from "contexts";
import CustomText from "atoms/CustomText/CustomText.component";
import { Images } from "theme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Snackbar = ({
  message,
  onDismiss,
  actionLabel,
  onActionPress,
  hasBottomBar = false,
}: SnackbarProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors, hasBottomBar), [colors]);

  return (
    <SafeAreaProvider>
      <View style={themedStyles.container}>
        <View style={themedStyles.messageContainer}>
          <CustomText
            font="headline3"
            weight="medium"
            text={message}
            overrideStyle={themedStyles.message}
          />

          {!actionLabel && (
            <TouchableOpacity
              onPress={onDismiss}
              hitSlop={8}
              style={themedStyles.closeButton}
            >
              <Image source={Images.close} style={themedStyles.icon} />
            </TouchableOpacity>
          )}

          {actionLabel && (
            <TouchableOpacity
              onPress={onActionPress}
              style={themedStyles.actionButton}
            >
              <CustomText
                font="headline3"
                weight="semiBold"
                text={actionLabel}
                overrideStyle={themedStyles.action}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
};

export default Snackbar;
