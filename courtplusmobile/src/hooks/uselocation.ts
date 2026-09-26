import DeviceCountry, { TYPE_CONFIGURATION } from "react-native-device-country";
import { useCallback } from "react";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid } from "react-native";
import { isAndroid, Location, reverseGeocode } from "utils";
import { useUserStore } from "store";

// Riyadh, until the customer picks a location.
//
// The radius is in KM and must match DEFAULT_COURTS_RADIUS (500 km). It was
// set to 5, which the court query treats as an explicit choice — so every
// customer silently searched a 5 km circle and saw nothing unless a venue was
// almost next door. The filter still overrides this when the customer picks
// their own radius.
const DEFAULT_SEARCH_RADIUS_KM = 500;

const FALLBACK_LOCATION = {
  address: "",
  lat: 24.7136,
  long: 46.6753,
  radius: DEFAULT_SEARCH_RADIUS_KM,
};

export const useLocation = () => {
  const updateLocation = useUserStore((store) => store.updateLocation);

  const getLocationPermission = async () => {
    if (isAndroid) {
      const grantedPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return grantedPermission === "granted";
    } else {
      const locationPermission = await Geolocation.requestAuthorization(
        "whenInUse"
      );
      return locationPermission === "granted";
    }
  };

  const getPosition = async (pos: Location) => {
    const response = await getLocationName(pos);
    updateLocation({
      ...pos,
      address: response,
    });
  };

  const getLocationDetails = async () => {
    const isLocationGranted = await getLocationPermission();
    if (isLocationGranted) {
      Geolocation.getCurrentPosition(
        (pos) => {
          return getPosition({
            address: "",
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
            radius: DEFAULT_SEARCH_RADIUS_KM,
          });
        },
        // GPS off / timeout: fall back so lists still load.
        () => updateLocation(FALLBACK_LOCATION),
        { timeout: 15000, maximumAge: 60000 }
      );
      return true;
    }
    // Permission denied: same fallback instead of an endless spinner.
    updateLocation(FALLBACK_LOCATION);
    return false;
  };

  const getDeviceCountryCode = async () => {
    try {
      const isGranted = await getLocationPermission();
      if (isGranted) {
        const deviceCountry = await DeviceCountry.getCountryCode(
          TYPE_CONFIGURATION
        );
        return deviceCountry.code;
      }
    } catch (_) {
      return "EG";
    }
  };

  const getLocationName = useCallback(async (pos: Location) => {
    try {
      const result = await reverseGeocode(pos.lat, pos.long);
      return result?.formattedAddress ?? "";
    } catch (error) {
      return "";
    }
  }, []);

  return {
    getLocationPermission,
    getLocationDetails,
    getDeviceCountryCode,
    getLocationName,
    getPosition,
  };
};
