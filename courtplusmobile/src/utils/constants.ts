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
  // "Mixed" maps to the backend's Gender.OTHER. Without it an organiser had
  // to pick male or female, and leaving the field untouched sent an empty
  // string that failed validation with a generic error.
  {
    title: t("openMatch.mixedGender"),
    value: "other",
  },
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

/**
 * Match sizes offered per sport, as players-a-side (the API's `playersASide`;
 * total seats are always twice this).
 *
 * The list used to be 1v1 and 2v2 for EVERY sport, which is right for padel
 * and tennis and impossible for football — a five-a-side organiser could not
 * express their match at all, and the backend refused a fifth joiner whatever
 * they picked. Team sports now get the real formats; the totals they imply
 * (10, 12, 14, 22) sit under the 22-player ceiling the API allows.
 *
 * Teams are only how the size is EXPRESSED. Nothing assigns players to a
 * side — whoever turns up splits themselves at the venue.
 */
const TEAM_SPORT_SIZES: Item[] = [
  { key: "5", title: t("openMatch.fiveASide") },
  { key: "6", title: t("openMatch.sixASide") },
  { key: "7", title: t("openMatch.sevenASide") },
  { key: "11", title: t("openMatch.elevenASide") },
];

const RACKET_SPORTS = ["tennis", "paddle", "padel", "squash"];

export const getMatchSizesForSport = (sport?: string): Item[] => {
  if (!sport || RACKET_SPORTS.includes(sport.toLowerCase())) {
    return playersAside;
  }
  return TEAM_SPORT_SIZES;
};


/**
 * Split payment ("pay your part") is hidden for now: the organiser pays the
 * whole booking. Flip this back to true to restore the per-seat split — the
 * backend still accepts and settles `paymentType: "split"`, so nothing else
 * has to change.
 */
export const SPLIT_PAYMENT_ENABLED = false;
