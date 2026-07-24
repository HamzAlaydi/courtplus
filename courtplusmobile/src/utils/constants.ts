import { t } from "i18next";
import { Item, ListItem, SportFilterItem } from "./types";
import { LocaleConfig } from "react-native-calendars";
import { Dimensions, I18nManager } from "react-native";
import { Locale } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toUTCDate } from "./date";
import { getApp } from "@react-native-firebase/app";
import { Images } from "theme";

export const { width } = Dimensions.get("window");

export const sortList: Item[] = [
  {
    key: "hourlyRate,ASC",
    title: t("filters.priceLowHigh"),
  },
  {
    key: "hourlyRate,DESC",
    title: t("filters.priceHighLow"),
  },
  {
    key: "rating,DESC",
    title: t("filters.ratingHigh"),
  },
  {
    key: "rating,ASC",
    title: t("filters.ratingLow"),
  },
];

export const sportList: Item[] = [
  {
    title: t("general.tennis"),
    key: "tennis",
  },
  {
    title: t("general.football"),
    key: "football",
  },
  {
    title: t("general.paddle"),
    key: "paddle",
  },
];

export const genderItems: ListItem[] = [
  {
    title: t("general.male"),
    value: "male",
  },
  {
    title: t("general.female"),
    value: "female",
  },
];

LocaleConfig.locales.en = LocaleConfig.locales[""];

LocaleConfig.defaultLocale = I18nManager.isRTL ? "ar" : "en";

LocaleConfig.locales["ar"] = {
  monthNames: [
    "يَنايِر",
    "فِبْرايِر",
    "مارِس",
    "أَبْرِيل",
    "مايُو",
    "يُونِيُو",
    "يُولِيُو",
    "أَغُسْطُس",
    "سِبْتَمْبَر",
    "أُكْتُوبَر",
    "نُوفَمْبَر",
    "دِيسَمْبَر",
  ],
  monthNamesShort: [
    "يَنايِر",
    "فِبْرايِر",
    "مارِس",
    "أَبْرِيل",
    "مايُو",
    "يُونِيُو",
    "يُولِيُو",
    "أَغُسْطُس",
    "سِبْتَمْبَر",
    "أُكْتُوبَر",
    "نُوفَمْبَر",
    "دِيسَمْبَر",
  ],
  dayNames: [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ],
  dayNamesShort: [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ],
};

export const activityTabsList = [
  {
    key: "current",
    title: t("activity.currentBookings"),
  },
  {
    key: "history",
    title: t("activity.bookingHistory"),
  },
];

export const currentDate = toUTCDate(new Date());

interface Locales {
  en: Locale;
  ar: Locale;
}

export const locales: Locales = {
  en: enUS,
  ar: ar,
};

export const isRTL = I18nManager.isRTL;

export const VISIBLE_WEEKS_AROUND = 2;
export const WEEKS_BATCH = 3;

export const timeItems: Item[] = [
  {
    key: "morning",
    title: t("profile.morning"),
  },
  {
    key: "day",
    title: t("profile.day"),
  },
  {
    key: "evening",
    title: t("profile.evening"),
  },
  {
    key: "night",
    title: t("profile.night"),
  },
];

export const sports: SportFilterItem[] = [
  {
    label: t("court.allCourts"),
    value: "all_courts",
    icon: "court",
  },
  {
    label: t("general.tennis"),
    value: "tennis",
    icon: "tennis",
  },
  {
    label: t("general.football"),
    value: "football",
    icon: "football",
  },
  {
    label: t("general.paddle"),
    value: "paddle",
    icon: "paddle",
  },
];

export const gameTypeList: Item[] = [
  {
    key: "1",
    title: "1 vs 1",
  },
  {
    key: "2",
    title: "2 vs 2",
  },
];

export const levels: Item[] = [
  {
    key: "beginner",
    title: t("general.beginner"),
  },
  {
    key: "intermediate",
    title: t("general.intermediate"),
  },
  {
    key: "intermediate_high",
    title: t("general.intermediateHigh"),
  },
  {
    key: "advanced",
    title: t("general.advanced"),
  },
  {
    key: "competitive",
    title: t("general.competitive"),
  },
];

export const profileFollowersList: (
  followersCount: number,
  followingCount: number
) => Item[] = (followersCount: number, followingCount: number) => [
  {
    key: "followers",
    title: t("profile.followersCount", { count: followersCount }),
  },
  {
    key: "following",
    title: t("profile.followingCount", { count: followingCount }),
  },
];

export const courtDetailsTabsList = [
  {
    key: "details",
    title: t("court.details"),
  },
  {
    key: "availability",
    title: t("court.availability"),
  },
  {
    key: "specs",
    title: t("court.specs"),
  },
  {
    key: "moments",
    title: t("court.moments"),
  },
];

const IMAGE_MAX_SIZE_MB = 10;
export const IMAGE_MAX_SIZE_BYTES = IMAGE_MAX_SIZE_MB * 1024 * 1024;

export const firebaseApp = getApp();

export const reportReasons: Item[] = [
  {
    title: "Violence,Abuse and Related reasons",
    key: "violence",
  },
  {
    title: "Fake Account",
    key: "fakeAccount",
  },
  {
    title: "Hate Speech",
    key: "hateSpeech",
  },
  {
    title: "Other",
    key: "other",
  },
];

export const playersAside: Item[] = [
  {
    key: "1",
    title: t("openMatch.one"),
  },
  {
    key: "2",
    title: t("openMatch.two"),
  },
];
