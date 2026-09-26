import { formatInTimeZone } from "date-fns-tz";
import { QueryClient } from "@tanstack/react-query";
import {
  I18nManager,
  ImageSourcePropType,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Sport, User } from "src/models/User";
import i18n from "translation/index";
import { hasDynamicIsland, hasNotch } from "react-native-device-info";
import { SportFilterItem, SportItem } from "./types";
import { queryKeys, querykeysType } from "./keys";
import { genderItems, IMAGE_MAX_SIZE_BYTES, isRTL, locales } from "./constants";
import { AppFontsProps, ColorsType, Images } from "theme";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Booking,
  Court,
  FriendShip,
  Participant,
  Slot,
  TimeSlot,
} from "models";
import { t } from "i18next";
import { ErrorCode } from "react-native-image-picker";
import FastImage from "react-native-fast-image";
import { getApiErrorMessage } from "./errorMessages";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import { Asset } from "react-native-image-picker";
import { ReactNode } from "react";
import {
  AuthorizationStatus,
  getMessaging,
} from "@react-native-firebase/messaging";
import { addDays } from "date-fns/addDays";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { startOfWeek } from "date-fns/startOfWeek";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import RNRestart from "react-native-restart";
import parsePhoneNumberFromString from "libphonenumber-js";
import { CountryItem } from "react-native-country-codes-picker";

const dateFNSFormat = format;

export const isAndroid = Platform.OS == "android";

export const isArabic = I18nManager.isRTL;

export const queryClient = new QueryClient();

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const mapSportLevel = (level: string) => {
  switch (level) {
    case "beginner":
      return i18n.t("general.beginner");
    case "intermediate":
      return i18n.t("general.intermediate");
    case "intermediate_high":
      return i18n.t("general.intermediateHigh");
    case "advanced":
      return i18n.t("general.advanced");
    case "competitive":
      return i18n.t("general.competitive");
    default:
      return i18n.t("general.beginner");
  }
};

export const mapSportItem = (sport: Sport): SportItem => {
  switch (sport.name) {
    case "paddle":
      return {
        name: i18n.t("general.paddle"),
        icon: "paddle",
        level: mapSportLevel(sport.level),
        value: "paddle",
        id: sport.id,
        timePreference: sport.timePreference,
      };
    case "tennis":
      return {
        name: i18n.t("general.tennis"),
        icon: "tennis",
        level: mapSportLevel(sport.level),
        value: "tennis",
        id: sport.id,
        timePreference: sport.timePreference,
      };
    case "football":
      return {
        name: i18n.t("general.football"),
        icon: "football",
        level: mapSportLevel(sport.level),
        value: "football",
        id: sport.id,
        timePreference: sport.timePreference,
      };
    default:
      return {
        name: i18n.t("general.paddle"),
        icon: "paddle",
        level: mapSportLevel(sport.level),
        value: "paddle",
        id: sport.id,
        timePreference: sport.timePreference,
      };
  }
};

export const mapUserSports = (sports: Sport[]) => {
  return sports.map(mapSportItem);
};

export const hasSafeArea = () => {
  return hasDynamicIsland() || hasNotch();
};

export const getNextPage = (lastPage: any[], pages: any[]) => {
  return lastPage && lastPage.length >= 10 ? pages?.length + 1 : undefined;
};

export const mapSportGame: (game: Games) => {
  name: string;
  icon: keyof typeof Images;
} = (game: Games) => {
  switch (game) {
    case Games.PADDLE:
      return {
        name: i18n.t("general.paddle"),
        icon: "paddle",
      };
    case Games.TENNIS:
      return {
        name: i18n.t("general.tennis"),
        icon: "tennis",
      };
    case Games.FOOTBALL:
      return {
        name: i18n.t("general.football"),
        icon: "football",
      };
    default:
      return {
        name: i18n.t("general.paddle"),
        icon: "paddle",
      };
  }
};

export enum Games {
  TENNIS = "tennis",
  FOOTBALL = "football",
  PADDLE = "paddle",
}

export enum HeaderType {
  Main = "Main",
  Profile = "Profile",
  Activity = "Activity",
  OpenMatch = "OpenMatch",
  Search = "Search",
  Community = "Community",
  Report = "Report",
  Onboarding = "Onboarding",
}

/**
 * Many accounts (social sign-in especially) carry only a first name.
 * Interpolating both parts unconditionally rendered "Name undefined", and
 * Update Profile seeded its form from that string and saved the literal
 * "undefined" back as the surname.
 */
export const generateFullName = (data: {
  firstName?: string | null;
  lastName?: string | null;
}) => {
  return [data?.firstName, data?.lastName]
    .map((part) => part?.trim())
    .filter((part) => !!part)
    .join(" ");
};

export type Location = {
  long: number;
  lat: number;
  address: string;
  placeId?: string;
  radius?: number;
};

export const selectSportsFilter = (
  newItem: SportFilterItem,
  selectedFilters: SportFilterItem[],
  allSport: SportFilterItem
) => {
  let newSports: SportFilterItem[] = [];
  const allSportsIncluded = selectedFilters.find(
    (item) => item.value === "all_courts"
  );
  const isItemIncluded = selectedFilters.some(
    (elem) => elem.value === newItem.value
  );

  if (newItem.value === "all_courts") {
    newSports = !!allSportsIncluded ? selectedFilters : [newItem];
  } else {
    newSports = selectedFilters.filter((item) => item.value !== "all_courts");

    if (isItemIncluded) {
      newSports = newSports.filter(
        (filterItem) => filterItem.value !== newItem.value
      );
    } else {
      newSports.push(newItem);
    }
  }

  if (!newSports.length) {
    newSports.push(allSport);
  }

  return newSports;
};

export const convertDistance = (distance: number) => {
  if (distance < 1000) {
    return `${distance} ${t("general.m")}`;
  }
  return `${(distance / 1000).toFixed(1)} ${t("general.km")}`;
};

export type ActionListItem = {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string | ReactNode;
  titleColor?: keyof ColorsType;
  subtitleColor?: keyof ColorsType;
  subtitleFont?: keyof AppFontsProps;
  right?: React.JSX.Element;
  overrideContainerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  overrideTextStyle?: StyleProp<TextStyle>;
};

export const invalidateQuery = (query: querykeysType) => {
  queryClient.invalidateQueries({ queryKey: [query] });
};

export const setQueryData = <T>(query: querykeysType, data: T) => {
  queryClient.setQueryData([query], data);
};

export const refetchQueries = (queries: querykeysType[]) => {
  queries.forEach((query) => {
    queryClient.refetchQueries({ queryKey: [query] });
  });
};

export const mapGenderValue = (value: string) => {
  return genderItems.find((item) => item.value === value);
};

export const mapGenderTitle = (value: string) => {
  return genderItems.find((item) => item.title === value);
};

export const formatDate = (date: string, format: string = "yyyy-MM-dd") => {
  return dateFNSFormat(date, format, {
    locale: I18nManager.isRTL ? ar : enUS,
  });
};

/**
 * Format an API timestamp (UTC ISO) in the COURT's timezone.
 *
 * Booking screens used to slice the ISO string ("…T07:00:00Z" -> "07:00"),
 * i.e. they showed UTC: a 10:00 Riyadh booking read 07:00 on the ticket.
 * Falls back to the device timezone when the booking carries none.
 */
export const formatInZone = (
  date: string | Date,
  format: string,
  timeZone?: string | null
) => {
  const value = typeof date === "string" ? new Date(date) : date;
  const locale = I18nManager.isRTL ? ar : enUS;
  try {
    if (timeZone) {
      return formatInTimeZone(value, timeZone, format, { locale });
    }
  } catch {
    // unknown zone id: fall through to the device timezone
  }
  return dateFNSFormat(value, format, { locale });
};

/** @deprecated use formatInZone(date, "HH:mm", timeZone) */
export const convertToUTCTime = (date: string, timeZone?: string | null) => {
  return formatInZone(date, "HH:mm", timeZone);
};

export const convertDateToUTCSeconds = (startDate: string) => {
  return (new Date(startDate).getTime() - new Date().getTime()) / 1000;
};

export const getDaysOfWeek = () => {
  const today = new Date();
  const start = startOfWeek(today, { locale: locales[isRTL ? "ar" : "en"] });
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(
      format(addDays(start, i), "EEE", { locale: locales[isRTL ? "ar" : "en"] })
    );
  }
  return days;
};

export const generateWeek = (date: Date): Date[] => {
  const start = startOfWeek(toUTCDate(date), {
    locale: locales[isRTL ? "ar" : "en"],
  });
  return Array.from({ length: 7 }, (_, i) => toUTCDate(addDays(start, i)));
};

export const generateWeeks = (
  centerDate: Date,
  totalWeeks: number = 5
): Date[][] => {
  const weeks: Date[][] = [];
  const offset = Math.floor(totalWeeks / 2);
  for (let i = -offset; i <= offset; i++) {
    const weekStart = addDays(centerDate, i * 7);
    weeks.push(generateWeek(weekStart));
  }
  return weeks;
};

import { toUTCDate } from "./date";
export { toUTCDate } from "./date";

export const convertCustomerToFriendship = (customer: User): FriendShip => {
  return {
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    id: customer.id,
    followerId: customer.id,
    followingId: customer.id,
    user: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      username: customer.username,
      email: customer.email ?? "",
      avatarUrl: customer.avatarUrl ?? "",
      isFollowing: false,
      isFollowed: false,
      bookingsCount: customer.bookingsCount,
      matchesPlayedCount: customer.matchesPlayedCount,
      minutesPlayedCount: customer.minutesPlayedCount,
      followersCount: customer.followersCount,
      followingCount: customer.followingCount,
      gender: customer.gender,
      phoneNumber: customer.phoneNumber,
      dateOfBirth: customer.dateOfBirth,
      verifiedAt: customer.verifiedAt,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      sports: customer.sports,
    },
  };
};

export const dehydrateQuery = (query: any) => {
  const queryIsReadyForPersistance = query.state.status === "success";
  if (queryIsReadyForPersistance) {
    const { queryKey } = query;
    const excludeFromPersisting =
      queryKey.includes(queryKeys.getHomeCourts) ||
      queryKey.includes(queryKeys.getUserLocation);
    return !excludeFromPersisting;
  }
  return queryIsReadyForPersistance;
};

export const getErrorMessage = (message: string) => {
  return getApiErrorMessage(message);
};

/**
 * The API returns a venue's position as GeoJSON — `coordinates` is
 * [longitude, latitude], NOT [lat, lng]. Swapping them drops the pin in the
 * wrong hemisphere, so the order is unpacked explicitly here.
 */
export const getMapsUrl = (location?: {
  address?: string;
  coordinates?: { coordinates?: number[] } | null;
}): string | null => {
  const [lng, lat] = location?.coordinates?.coordinates ?? [];
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  // No pin on file: fall back to a text search so the button still does
  // something useful instead of silently doing nothing.
  if (location?.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location.address
    )}`;
  }
  return null;
};

/**
 * Opens the venue in Google Maps. The https form is deliberate: Android and
 * iOS both hand it to the Google Maps app when installed and fall back to the
 * browser when it is not, so no platform branch is needed.
 */
export const openInMaps = async (location?: {
  address?: string;
  coordinates?: { coordinates?: number[] } | null;
}): Promise<boolean> => {
  const url = getMapsUrl(location);
  if (!url) {
    return false;
  }
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
};

export const formatCurrency = (amount: number) => {
  return isRTL
    ? `${amount} ${t("general.currency")}`
    : `${t("general.currency")} ${amount}`;
};

export const flattenData = <T>(data: { pages: T[][] }) => {
  return (data?.pages.flatMap((page) => page) as T[]) ?? [];
};

export const formatTime = (date: string) => {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: isRTL ? ar : enUS,
  });
};

export const onMutate = async <T>(query: querykeysType, newData: T) => {
  await queryClient.cancelQueries({
    queryKey: [query],
  });
  const previousData = queryClient.getQueryData<T>([query]);
  queryClient.setQueryData([query], newData);
  await queryClient.cancelQueries({
    queryKey: [query],
  });
  return { previousData, newData };
};

export const onPhotoError = (error: ErrorCode) => {
  switch (error) {
    case "permission":
      return t("messages.permission");
    case "camera_unavailable":
      return t("messages.cameraUnavailable");
    default:
      return t("general.error");
  }
};

export const clearCache = () => {
  queryClient.clear();
  FastImage.clearDiskCache();
  FastImage.clearMemoryCache();
};

export const compressImage = async (image: Asset, maxTries = 3) => {
  let tries = 0;

  while (tries < maxTries) {
    const compressedImage = await ImageResizer.createResizedImage(
      image.uri ?? "",
      image.width ?? 1024,
      image.height ?? 1024,
      "JPEG",
      80
    );
    if (compressedImage?.size > IMAGE_MAX_SIZE_BYTES) {
      tries++;
    } else {
      return compressedImage;
    }
  }
  return null;
};

export const convertImageType = (type: string) => {
  switch (type) {
    case "avatarAssetId":
      return "profile_picture";
    case "coverAssetId":
      return "cover_picture";
    case "image":
      return "image";
  }
};

export const convertMinutesToHours = (minutes: number) => {
  if (minutes === 0) return 0;
  return (minutes / 60).toFixed(1);
};

export const getTimeSlots = (slots: Slot[]) => {
  const morningSlots = slots.filter((item) => item.startTime < "13:00");
  const daysSlots = slots.filter(
    (item) => item.startTime >= "13:00" && item.startTime <= "18:00"
  );
  const eveningSlots = slots.filter(
    (item) => item.startTime > "18:00" && item.startTime <= "24:00"
  );
  const slotsArr: TimeSlot[] = [];
  if (morningSlots?.length) {
    slotsArr.push({
      label: t("booking.morning"),
      time: morningSlots,
    });
  }
  if (daysSlots?.length) {
    slotsArr.push({
      label: t("booking.day"),
      time: daysSlots,
    });
  }
  if (eveningSlots?.length) {
    slotsArr.push({
      label: t("booking.evening"),
      time: eveningSlots,
    });
  }
  return slotsArr;
};

export const enableNotificationPermission = async () => {
  const firebaseMessaging = getMessaging();
  if (isAndroid) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  } else {
    const hasPermission = await firebaseMessaging.hasPermission();
    if (hasPermission !== AuthorizationStatus.AUTHORIZED) {
      await firebaseMessaging.requestPermission();
    }
  }
};

export const changeLanguage = () => {
  const newLanguage = i18n.language === "ar" ? "en" : "ar";
  i18n.changeLanguage(newLanguage);
  I18nManager.forceRTL(newLanguage === "ar");
  RNRestart.restart();
};

export const convertMinutesToSeconds = (minutes: number) => {
  return minutes * 60;
};

export function toEnglishDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    // Arabic-Indic (٠..٩)
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    // Eastern Arabic-Indic/Persian (۰..۹)
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return d;
  });
}

export const formatNumber = (num: number) => {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return num.toString();
};

export const maskPhoneNumber = (phone: string): string => {
  const match = phone.match(/^(\+\d{1,4})/);
  const countryCode = match ? match[1] : "";

  const rest = phone.replace(countryCode, "").replace(/\s+/g, "");

  if (rest.length <= 3) return phone;

  const maskedPart = "*".repeat(rest.length - 3);
  const visiblePart = rest.slice(-3);

  return `${countryCode}${maskedPart}${visiblePart}`;
};

export const excludeCountryCode = (phone: string): string => {
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed) return phone;
  return parsed.nationalNumber;
};

export const includeCountryCode = (phone: string): CountryItem => {
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed)
    return {
      code: "EG",
      dial_code: "+20",
      name: { en: "Egypt", ar: "مصر" },
      flag: "",
    };
  return {
    code: parsed.country ?? "",
    dial_code: `+${parsed.countryCallingCode}`,
    name: { en: parsed.country ?? "", ar: parsed.country ?? "" },
    flag: parsed.country ?? "",
  };
};

export const getCreator = (participants: Participant[]) => {
  return participants.find((participant) => participant.isCreator);
};

export const SLOT_DURATION_MINUTES = 30;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const sortSlotsByStartTime = (slots: Slot[]) =>
  [...slots].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

/**
 * Total time the customer actually selected.
 *
 * This used to measure from the first slot's start to the LAST slot's start,
 * which drops the final slot: two adjacent 30-minute chips came out as 30
 * minutes, three as 60. The customer was charged for, and given, one slot
 * less than they picked every single time.
 */
export const getSlotsDurationMinutes = (slots: Slot[]) => {
  if (!slots?.length) return 0;
  return slots.length * SLOT_DURATION_MINUTES;
};

/**
 * Whether the selection is one unbroken block.
 *
 * A booking is a single start time plus a duration, so a gap in the selection
 * would silently book (and charge for) the slot in between — which may not
 * even be free.
 */
export const areSlotsContiguous = (slots: Slot[]) => {
  if (!slots?.length) return true;
  const sorted = sortSlotsByStartTime(slots);
  return sorted.every(
    (slot, index) =>
      index === 0 ||
      timeToMinutes(slot.startTime) ===
        timeToMinutes(sorted[index - 1].startTime) + SLOT_DURATION_MINUTES,
  );
};

export const formatTimeRange = (slots: Slot[]) => {
  if (!slots?.length) return "";
  const sortedSlots = sortSlotsByStartTime(slots);
  const firstSlot = sortedSlots[0];
  const lastSlot = sortedSlots[sortedSlots.length - 1];

  // End at the last slot's END, not its start — the old form hid the final
  // half hour the customer had selected and paid for.
  const formattedTime = `${firstSlot?.startTime} - ${lastSlot?.endTime}`;

  return formattedTime;
};

export const getCourtImage = (court: Court): ImageSourcePropType => {
  if (court.mainAsset) {
    return { uri: court.mainAsset };
  }
  // Skip video assets — they can't be rendered by an Image component.
  const imageAsset = court.assets?.find(
    (asset) =>
      !asset.mimeType?.startsWith("video") &&
      !asset.type?.toLowerCase().includes("video")
  );
  if (imageAsset) {
    return { uri: imageAsset.url };
  }
  return Images.openMatch;
};
