import { Dimensions, EmitterSubscription, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const BREAKPOINTS = {
  SMALL_PHONE: 320,
  PHONE: 375,
  LARGE_PHONE: 414,
  SMALL_TABLET: 768,
  TABLET: 1024,
} as const;

const getDeviceType = (width: number) => {
  if (width < BREAKPOINTS.SMALL_PHONE) return "small-phone";
  if (width < BREAKPOINTS.PHONE) return "phone";
  if (width < BREAKPOINTS.LARGE_PHONE) return "large-phone";
  if (width < BREAKPOINTS.SMALL_TABLET) return "small-tablet";
  return "tablet";
};

const createScalingFunctions = () => {
  const deviceType = getDeviceType(width);

  // Scale factors with device-specific adjustments
  const baseHorizontalScale = width / guidelineBaseWidth;
  const baseVerticalScale = height / guidelineBaseHeight;

  // Apply different scaling strategies based on device type
  const getScaleFactor = (baseScale: number, deviceType: string) => {
    switch (deviceType) {
      case "small-phone":
        // More conservative scaling for small devices
        return Math.max(0.85, Math.min(1.15, baseScale));
      case "tablet":
        // Less aggressive scaling for tablets
        return Math.max(1.0, Math.min(1.5, baseScale * 0.85));
      default:
        // Standard scaling with reasonable bounds
        return Math.max(0.75, Math.min(2.0, baseScale));
    }
  };

  const horizontalScaleFactor = getScaleFactor(baseHorizontalScale, deviceType);
  const verticalScaleFactor = getScaleFactor(baseVerticalScale, deviceType);

  const horizontalScale = (size: number) => {
    const pixelSize = size * horizontalScaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(pixelSize));
  };

  const verticalScale = (size: number) => {
    const pixelSize = size * verticalScaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(pixelSize));
  };

  const moderateScale = (size: number, factor = 0.5) => {
    const scaledSize = size + (horizontalScale(size) - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
  };

  // Font scaling with better text readability
  const fontScale = (size: number) => {
    const scale = Math.min(horizontalScaleFactor, 1.3); // Cap font scaling
    const scaledSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
  };

  return {
    horizontalScale,
    verticalScale,
    moderateScale,
    fontScale,
    deviceType,
    dimensions: { width, height },
    scaleFactor: {
      horizontal: horizontalScaleFactor,
      vertical: verticalScaleFactor,
    },
  };
};

let scalingFunctions = createScalingFunctions();

const updateScaling = () => {
  scalingFunctions = createScalingFunctions();
};

let dimensionsSubscription: EmitterSubscription | null = null;

const subscribeToOrientationChange = () => {
  if (dimensionsSubscription) {
    dimensionsSubscription?.remove();
  }

  dimensionsSubscription = Dimensions.addEventListener("change", updateScaling);
  return dimensionsSubscription;
};

subscribeToOrientationChange();

const horizontalScale = (size: number) =>
  scalingFunctions.horizontalScale(size);
const verticalScale = (size: number) => scalingFunctions.verticalScale(size);
const moderateScale = (size: number) => scalingFunctions.fontScale(size);

const spacing = {
  2: horizontalScale(2),
  4: horizontalScale(4),
  6: horizontalScale(6),
  8: horizontalScale(8),
  10: horizontalScale(10),
  12: horizontalScale(12),
  14: horizontalScale(14),
  16: horizontalScale(16),
  18: horizontalScale(18),
  20: horizontalScale(20),
  22: horizontalScale(22),
  24: horizontalScale(24),
  26: horizontalScale(26),
  28: horizontalScale(28),
  30: horizontalScale(30),
  32: horizontalScale(32),
  34: horizontalScale(34),
  36: horizontalScale(36),
  40: horizontalScale(40),
  44: horizontalScale(44),
  46: horizontalScale(46),
  48: horizontalScale(48),
  50: horizontalScale(50),
  56: horizontalScale(56),
  58: horizontalScale(58),
  60: horizontalScale(60),
  70: horizontalScale(70),
  72: horizontalScale(72),
};

export const cleanup = () => {
  if (dimensionsSubscription) {
    dimensionsSubscription.remove();
    dimensionsSubscription = null;
  }
};

export {
  horizontalScale,
  moderateScale,
  verticalScale,
  spacing,
  guidelineBaseHeight,
};
