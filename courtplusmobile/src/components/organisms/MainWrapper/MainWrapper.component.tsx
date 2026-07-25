import React from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MainWrapperProps } from "./MainWrapper.types";
import styles from "./MainWrapper.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "contexts";

const MainWrapper = ({
  children,
  scrollEnabled = false,
  overrideContainerStyle,
  overrideContentStyle,
  enableSafeArea = false,
  whiteBackground = false,
  disableBottomPadding,
  refreshControl,
}: MainWrapperProps) => {
  const { bottom, top } = useSafeAreaInsets();
  const {
    currentTheme: { colors },
  } = useThemeContext();

  const Wrapper = scrollEnabled ? KeyboardAwareScrollView : View;
  const bottomPadding = disableBottomPadding ? 0 : bottom;
  return (
    <Wrapper
      style={[
        styles.container,
        { paddingBottom: bottomPadding, paddingTop: enableSafeArea ? top : 0 },
        !scrollEnabled && styles.content,
        overrideContainerStyle,
        !scrollEnabled && overrideContentStyle,
        whiteBackground && { backgroundColor: colors.WHITE },
      ]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, overrideContentStyle]}
      scrollEnabled={scrollEnabled}
      keyboardShouldPersistTaps="handled"
      {...(scrollEnabled && refreshControl ? { refreshControl } : {})}
    >
      {children}
    </Wrapper>
  );
};

export default MainWrapper;
