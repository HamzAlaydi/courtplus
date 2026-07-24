import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  BookingFailedScreen,
  BookingSuccessScreen,
  BookingSummaryScreen,
  BranchDetailsScreen,
  ChooseTimeScreen,
  CourtDetailsScreen,
  CourtFilterScreen,
  InviteFriendScreen,
  ReviewsScreen,
  TimeSummaryScreen,
} from "screens";
import { CourtStackParamList } from "./types";

const CourtStack = createNativeStackNavigator<CourtStackParamList>();

export const CourtStackNavigator = () => {
  return (
    <CourtStack.Navigator screenOptions={{ headerShown: false }}>
      <CourtStack.Screen name="CourtDetails" component={CourtDetailsScreen} />
      <CourtStack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ gestureEnabled: false }}
      />
      <CourtStack.Screen
        name="BookingFailed"
        component={BookingFailedScreen}
        options={{ gestureEnabled: false }}
      />
      <CourtStack.Screen name="ChooseTime" component={ChooseTimeScreen} />
      <CourtStack.Screen name="TimeSummary" component={TimeSummaryScreen} />
      <CourtStack.Screen name="InviteFriend" component={InviteFriendScreen} />
      <CourtStack.Screen
        name="BookingSummary"
        component={BookingSummaryScreen}
      />
      <CourtStack.Screen name="BranchDetails" component={BranchDetailsScreen} />
      <CourtStack.Screen name="CourtFilter" component={CourtFilterScreen} />
      <CourtStack.Screen name="Reviews" component={ReviewsScreen} />
    </CourtStack.Navigator>
  );
};

export default CourtStackNavigator;
