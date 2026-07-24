import { AxiosResponse } from "axios";
import { Court, PaymentType, Slot, User } from "models";
import { ImageSourcePropType } from "react-native";
import { Images } from "theme";

export type ImageResponse = {
  assets: ImageType[];
};

export type ImageType = {
  timestamp: string;
  type: string;
  fileName: string;
  fileSize: number;
  height: number;
  width: number;
  id: string;
  uri: string;
};

export type SportItem = {
  name: string;
  icon: keyof typeof Images;
  level: string;
  value: string;
  id: string;
  timePreference: string;
};

export type SportFilterItem = {
  label: string;
  value: string;
  icon: keyof typeof Images;
};

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export type Item = {
  key: string;
  title: string;
};

export type SettingsItem = {
  icon: keyof typeof Images;
  title: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export type ListItem = {
  title: string;
  value: string;
};

export type MatchItemType = {
  title: string;
  image: ImageSourcePropType;
  description: string;
  icon: keyof typeof Images;
  onPress: () => void;
};

export type PaymentOption = {
  value: PaymentType;
  text: string;
  amount: number;
};

export type ImageOption = "camera" | "photoLibrary";

export type ImageData = {
  uri: string;
  fileSize: number;
  width: number;
  height: number;
  fileName: string;
  type: string;
  timestamp?: string;
  id?: string;
};

export type Filters = {
  sport?: string;
  placeId?: string;
  lng?: number;
  lat?: number;
  radius?: number;
  search?: string;
  sortDirection?: string;
  sortBy?: string;
};

export type PaginatedItems<T> = {
  pages: T[][];
  pageParams: number[];
};

export type OpenMatchData = {
  gender: string;
  level: string;
  playersASide: Item;
  participants: User[];
  court: Court;
  startsAt: string;
  sport: SportFilterItem;
  game: Item;
  timeSlots: Slot[];
  date: string;
};

export interface ApiResponse<T = any, D = any> extends AxiosResponse<T, D> {
  OK?: boolean;
}

export type ActionMenuItems = {
  text: string;
  icon: keyof typeof Images;
  onPress: () => void;
}[];
