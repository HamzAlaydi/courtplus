import React from "react";
import { StatusBar } from "react-native";
import { AuthenticatedStackParamList } from "./types";
import MainTabs from "./MainTabs";
import CourtStackNavigator from "./CourtStack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileStackNavigator from "./ProfileStack";
import ActivityStackNavigator from "./ActivityStack";
import {
  ChooseCourtScreen,
  CoachesScreen,
  ConfirmMatchScreen,
  NewMatchScreen,
  OpenMatchScreen,
  PickDateScreen,
  PickTimeScreen,
  ProfileScreen,
  SearchScreen,
  UserNotificationsScreen,
} from "screens";

const AuthenticatedStack =
  createNativeStackNavigator<AuthenticatedStackParamList>();

export const AuthenticatedStackNavigator = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AuthenticatedStack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <AuthenticatedStack.Screen name="MainTabs" component={MainTabs} />
        <AuthenticatedStack.Screen
          name="CourtStack"
          component={CourtStackNavigator}
        />
        <AuthenticatedStack.Screen
          name="ProfileStack"
          component={ProfileStackNavigator}
        />
        <AuthenticatedStack.Screen
          name="ActivityStack"
          component={ActivityStackNavigator}
        />
        <AuthenticatedStack.Screen name="Coaches" component={CoachesScreen} />
        <AuthenticatedStack.Screen
          name="Notifications"
          component={UserNotificationsScreen}
        />
        <AuthenticatedStack.Screen
          name="OpenMatch"
          component={OpenMatchScreen}
        />
        <AuthenticatedStack.Screen name="NewMatch" component={NewMatchScreen} />
        <AuthenticatedStack.Screen name="PickDate" component={PickDateScreen} />
        <AuthenticatedStack.Screen name="PickTime" component={PickTimeScreen} />
        <AuthenticatedStack.Screen
          name="ChooseCourt"
          component={ChooseCourtScreen}
        />
        <AuthenticatedStack.Screen
          name="ConfirmMatch"
          component={ConfirmMatchScreen}
        />
        <AuthenticatedStack.Screen name="Profile" component={ProfileScreen} />
        <AuthenticatedStack.Screen name="Search" component={SearchScreen} />
      </AuthenticatedStack.Navigator>
    </>
  );
};
