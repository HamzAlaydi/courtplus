import React, { useMemo } from "react";
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
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const Wrapper = scrollEnabled ? KeyboardAwareScrollView : View;
  const bottomPadding = disableBottomPadding ? 0 : bottom;
  return (
    <Wrapper
      style={[
        themedStyles.container,
        { paddingBottom: bottomPadding, paddingTop: enableSafeArea ? top : 0 },
        !scrollEnabled && themedStyles.content,
        overrideContainerStyle,
        !scrollEnabled && overrideContentStyle,
        whiteBackground && themedStyles.white,
      ]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[themedStyles.content, overrideContentStyle]}
      scrollEnabled={scrollEnabled}
      keyboardShouldPersistTaps="handled"
      {...(scrollEnabled && refreshControl ? { refreshControl } : {})}
    >
      {children}
    </Wrapper>
  );
};

export default MainWrapper;
