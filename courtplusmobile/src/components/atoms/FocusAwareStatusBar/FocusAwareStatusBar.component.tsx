import React from "react";
import { StatusBar, StatusBarProps } from "react-native";
import { useIsFocused } from "@react-navigation/native";

// Only the focused screen renders its StatusBar, so the style falls back to
// the navigator's default as soon as the screen loses focus.
const FocusAwareStatusBar = (props: StatusBarProps) => {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar {...props} /> : null;
};

export default FocusAwareStatusBar;
