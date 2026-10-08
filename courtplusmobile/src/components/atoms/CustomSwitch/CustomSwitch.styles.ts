import { StyleSheet } from "react-native";
import { ColorsType, Radius } from "theme";
import { horizontalScale } from "utils";

export const TRACK_WIDTH = horizontalScale(52);
export const TRACK_HEIGHT = horizontalScale(32);
export const TRACK_PADDING = horizontalScale(3);
export const KNOB_SIZE = TRACK_HEIGHT - TRACK_PADDING * 2;
export const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

export default (colors: ColorsType) =>
  StyleSheet.create({
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: Radius.pill,
      padding: TRACK_PADDING,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.HANDLE,
    },
    knob: {
      width: KNOB_SIZE,
      height: KNOB_SIZE,
      borderRadius: KNOB_SIZE / 2,
      backgroundColor: colors.WHITE,
      shadowColor: colors.INK,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 2,
    },
  });
