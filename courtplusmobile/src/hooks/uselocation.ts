import DeviceCountry, { TYPE_CONFIGURATION } from "react-native-device-country";
import { useCallback } from "react";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid } from "react-native";
import { isAndroid, Location, reverseGeocode } from "utils";
import { useUserStore } from "store";

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
            radius: 5,
          });
        },
        (error) => error
      );
      return true;
    }
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
