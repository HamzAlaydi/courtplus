import { Platform, ViewStyle } from "react-native";
import { horizontalScale, MOTION, spacing, verticalScale } from "utils";

const SHADOW_COLOR = "#0A1517";

/** Corner radii of the new look. Buttons, chips and status pills are pills. */
export const Radius = {
  /** Time-slot buttons, small chips, icon tiles. */
  small: horizontalScale(10),
  /** Time slots, segmented items, rating chips. */
  medium: horizontalScale(12),
  /** Inputs, search field, filter button, date cells. */
  input: horizontalScale(14),
  /** Quick-action tiles, list rows inside sheets. */
  tile: horizontalScale(18),
  /** Cards. */
  card: horizontalScale(20),
  /** Large cards (court list). */
  cardLarge: horizontalScale(22),
  /** Bottom sheets, header bands, photo overlap. */
  sheet: horizontalScale(28),
  pill: 999,
} as const;

/** Layout constants of the new look. */
export const Layout = {
  /** Side padding of every screen. */
  gutter: spacing[16],
  /** Vertical gap between sections. */
  sectionGap: verticalScale(22),
  /** Minimum touch target. */
  touch: horizontalScale(44),
  /** Primary CTA height. */
  buttonHeight: verticalScale(54),
  /** Field and search height. */
  fieldHeight: verticalScale(50),
} as const;

const makeShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: SHADOW_COLOR,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      shadowColor: SHADOW_COLOR,
      elevation,
    },
    default: {},
  }) ?? {};

/**
 * Soft card shadows. `card` matches 0 1px 2px / 0 6px 18px at ~6% ink on the
 * web; React Native only supports one shadow so the two are blended.
 */
export const Shadows = {
  none: {} as ViewStyle,
  /** Back buttons, search field, chips that sit on ground. */
  subtle: makeShadow(1, 3, 0.06, 1),
  /** Cards and tiles. */
  card: makeShadow(4, 12, 0.07, 3),
  /** Large court cards. */
  raised: makeShadow(6, 16, 0.08, 4),
  /** Sticky bottom bars (booking CTA). */
  bar: makeShadow(-6, 16, 0.08, 12),
};

/** Motion timings (ms) shared by components and screens. */
export const Motion = MOTION;
