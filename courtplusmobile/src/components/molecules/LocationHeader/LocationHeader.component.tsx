import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import styles from "./LocationHeader.styles";
import { CustomText, PressableScale } from "atoms/index";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { LocationHeaderProps } from "./LocationHeader.types";

const LocationHeader = ({
  currentLocation,
  onPress,
  onNotificationPress,
  overrideStyle,
  isLoading,
  showNotification = true,
  variant = "light",
  trailingComponent,
}: LocationHeaderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const isDark = variant === "dark";
  const themedStyles = useMemo(() => styles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();
  const isResolving = isLoading || !currentLocation;
  // Reverse geocoding can come back with empty parts (", " or "."); show the
  // generic label unless there is at least one letter to display.
  const locationLabel = /[A-Za-z\u00C0-\u024F\u0600-\u06FF]/.test(
    currentLocation ?? ""
  )
    ? currentLocation
    : t("general.location");

  return (
    <View style={[themedStyles.headerContainer, overrideStyle]}>
      {isResolving ? (
        <View
          style={[themedStyles.locationPill, themedStyles.loadingPill]}
          accessibilityLabel={t("general.location")}
        >
          <Image source={Images.location} style={themedStyles.pinIcon} />
          <ActivityIndicator
            size="small"
            color={isDark ? colors.WHITE : colors.INK}
          />
        </View>
      ) : (
        <PressableScale
          onPress={onPress}
          style={themedStyles.locationPill}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`${t("general.location")}: ${locationLabel}`}
        >
          <Image source={Images.location} style={themedStyles.pinIcon} />
          <CustomText
            font="headline3"
            weight="medium"
            text={locationLabel}
            overrideStyle={themedStyles.locationText}
            numberOfLines={1}
          />
          <Image source={Images.arrowDown} style={themedStyles.chevronIcon} />
        </PressableScale>
      )}

      <View style={themedStyles.trailingRow}>
        {showNotification && (
          <PressableScale
            onPress={onNotificationPress}
            style={themedStyles.notificationContainer}
            accessibilityRole="button"
            accessibilityLabel={t("notifications.title")}
          >
            <Image source={Images.bell} style={themedStyles.bellIcon} />
          </PressableScale>
        )}
        {trailingComponent}
      </View>
    </View>
  );
};

export default LocationHeader;
