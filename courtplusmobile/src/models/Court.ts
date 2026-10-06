import { Games } from "utils";
import { Branch } from "./Branch";
import { RatingStats } from "./RatingStats";

export type Asset = {
  createdAt: string;
  updatedAt: string;
  id: string;
  url: string;
  fileSize: number;
  mimeType: string;
  bucket: string;
  key: string;
  originalFileName: string;
  name: string;
  isUsed: boolean;
  resourceId: string;
  resourceType: string;
  type: "image" | "video";
};

export type Court = {
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  description: null;
  length: number;
  width: number;
  size: string;
  surface: string;
  isAirConditioned?: boolean;
  status: string;
  locationId: string;
  deletedAt: null;
  branch: Branch;
  assets: Asset[];
  sport: Games;
  hourlyRate: number;
  // The API returns the tenant's currency on every court (mapCourts sets it
  // from tenantPreferences, defaulting to SAR).
  currency?: string;
  avgRating: number;
  reviewsCount: number;
  branchId?: string;
  mainAsset?: string;
  distance: number;
  isBookmarked: boolean;
  unavailableDays: number[];
  location: {
    id: string;
    name: string;
    placeId: string;
    address: string;
    lng: number;
    lat: number;
  };
  totalBookings: number;
  totalOpenMatches: number;
  totalRevenue: number;
  ratingStats: RatingStats;
};
