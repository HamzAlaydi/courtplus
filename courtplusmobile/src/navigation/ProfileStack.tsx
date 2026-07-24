import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ChangePhoneScreen,
  FollowersScreen,
  HowCourtWorksScreen,
  NotificationsScreen,
  SavedScreen,
  SettingsScreen,
  TermsScreen,
  UpdateProfileScreen,
  VerifyPhoneScreen,
} from "screens";
import { ProfileStackParamList } from "./types";

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Saved" component={SavedScreen} />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
      <ProfileStack.Screen name="Terms" component={TermsScreen} />
      <ProfileStack.Screen
        name="HowCourtWorks"
        component={HowCourtWorksScreen}
      />
      <ProfileStack.Screen
        name="UpdateProfile"
        component={UpdateProfileScreen}
      />
      <ProfileStack.Screen name="ChangePhone" component={ChangePhoneScreen} />
      <ProfileStack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
      <ProfileStack.Screen name="Followers" component={FollowersScreen} />
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
