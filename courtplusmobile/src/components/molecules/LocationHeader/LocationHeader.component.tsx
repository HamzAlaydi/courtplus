import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import styles from "./LocationHeader.styles";
import { CustomText } from "atoms/index";
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
}: LocationHeaderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={[themedStyles.headerContainer, overrideStyle]}>
      <View>
        <CustomText
          text={t("general.location")}
          font="text"
          weight="semiBold"
          overrideStyle={themedStyles.locationTitle}
        />
        {isLoading || !currentLocation ? (
          <ActivityIndicator />
        ) : (
          <TouchableOpacity
            onPress={onPress}
            style={themedStyles.locationContainer}
          >
            <Image source={Images.location} />
            <CustomText
              font="headline3"
              weight="semiBold"
              text={currentLocation}
              overrideStyle={themedStyles.locationText}
              numberOfLines={1}
            />
            <Image source={Images.arrowDown} />
          </TouchableOpacity>
        )}
      </View>

      {showNotification && (
        <TouchableOpacity
          onPress={onNotificationPress}
          style={themedStyles.notificationContainer}
        >
          <Image source={Images.bell} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LocationHeader;
