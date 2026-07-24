import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityLogScreen,
  BookingDetailsScreen,
  BookingTicketScreen,
} from "screens";
import { ActivityStackParamList } from "./types";

const ActivityStack = createNativeStackNavigator<ActivityStackParamList>();

export const ActivityStackNavigator = () => {
  return (
    <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
      <ActivityStack.Screen
        name="BookingDetails"
        component={BookingDetailsScreen}
      />
      <ActivityStack.Screen name="ActivityLog" component={ActivityLogScreen} />
      <ActivityStack.Screen
        name="BookingTicket"
        component={BookingTicketScreen}
      />
    </ActivityStack.Navigator>
  );
};

export default ActivityStackNavigator;
