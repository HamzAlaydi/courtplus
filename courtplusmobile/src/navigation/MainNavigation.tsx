import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { MainStack } from "./MainStack";
import Geocoder from "react-native-geocoding";
import { navigationRef } from "./types";

export default function MainNavigation() {
  useEffect(() => {
    Geocoder.init("AIzaSyCyP-YultR_6jEofQEZnNRVPITqMv1Fsgo");
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
    </NavigationContainer>
  );
}
