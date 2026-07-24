import {
  NavigationContainerRef,
  NavigationProp,
} from "@react-navigation/native";
import { Booking, Court, User } from "models";
import React from "react";
import { Item, SportFilterItem } from "utils";

export const navigationRef =
  React.createRef<NavigationContainerRef<ReactNavigation.RootParamList>>();

export type OnboardingStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  OTPVerification: {
    phoneNumber: string;
    isLogin: boolean;
    signUpData?: {
      dateOfBirth?: string | undefined;
      fullName: string;
      username: string;
      gender: string;
      phoneNumber: string;
    };
  };
  Register: undefined;
  RecoverAccount: {
    phoneNumber?: string;
    code?: string;
    isLogin: boolean;
    token?: string;
  };
  CompleteProfile: undefined;
};

export type MainTabsParamList = {
  Community: undefined;
  Home: undefined;
  Courts: undefined;
  Profile: undefined;
  Activity: undefined;
};

export type AuthenticatedStackParamList = {
  MainTabs: { screen?: keyof MainTabsParamList };
  CourtStack: {
    screen: keyof CourtStackParamList;
    params?: CourtStackParamList[keyof CourtStackParamList];
  };
  ProfileStack: {
    screen: keyof ProfileStackParamList;
    params?: ProfileStackParamList[keyof ProfileStackParamList];
  };
  ActivityStack: {
    screen: keyof ActivityStackParamList;
    params?: ActivityStackParamList[keyof ActivityStackParamList];
  };
  Coaches: undefined;
  Notifications: undefined;
  OpenMatch: undefined;
  NewMatch: undefined;
  PickDate: undefined;
  PickTime: undefined;
  ChooseCourt: undefined;
  ConfirmMatch: {
    level: Item;
    gameType: string;
    game: SportFilterItem;
    participants: User[];
    autoAccept: boolean;
    gender: string;
  };
  Profile: { id: string };
  Search: undefined;
};

export type CourtStackParamList = {
  CourtDetails: { id: string };
  BranchDetails: { id: string };
  BookingSuccess: undefined;
  BookingFailed: undefined;
  ChooseTime: { court: Court };
  TimeSummary: undefined;
  InviteFriend: undefined;
  BookingSummary: undefined;
  CourtFilter: undefined;
  Reviews: { courtId: string };
};

export type ProfileStackParamList = {
  Settings: undefined;
  Saved: undefined;
  Notifications: undefined;
  Terms: undefined;
  HowCourtWorks: undefined;
  UpdateProfile: { user: User };
  ChangePhone: undefined;
  VerifyPhone: { phoneNumber: string };
  Followers: { followers: boolean; userId: string };
};

export type ActivityStackParamList = {
  BookingDetails: { item: Booking };
  ActivityLog: { id: string };
  BookingTicket: { item: Booking };
};

export type MainStackParamList = {
  Splash: undefined;
  OnboardingStack: undefined;
  AuthenticatedStack: {
    screen: keyof AuthenticatedStackParamList;
    params?: AuthenticatedStackParamList[keyof AuthenticatedStackParamList];
  };
};

export type OnboardingStackNavigationProp =
  NavigationProp<OnboardingStackParamList>;

export type AuthenticatedStackNavigationProp =
  NavigationProp<AuthenticatedStackParamList>;

export type CourtStackNavigationProp = NavigationProp<CourtStackParamList>;
export type ProfileStackNavigationProp = NavigationProp<ProfileStackParamList>;
export type ActivityStackNavigationProp =
  NavigationProp<ActivityStackParamList>;
export type MainStackNavigationProp = NavigationProp<MainStackParamList>;
export type MainTabsNavigationProp = NavigationProp<MainTabsParamList>;
