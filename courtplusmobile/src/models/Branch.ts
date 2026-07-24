import { Court } from "./Court";

export type Branch = {
  createdAt: string;
  updatedAt: string;
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  isVisible: boolean;
  tenantId: string;
  locationId: string;
  coverUrl: string;
  logoUrl: string;
  location: {
    createdAt: string;
    updatedAt: string;
    id: string;
    name: string;
    placeId: string;
    address: string;
    coordinates: {
      type: "Point";
      coordinates: number[];
    };
  };
  schedule: {
    createdAt: string;
    updatedAt: string;
    id: string;
    branchId: string;
    courtId: string;
    timeZone: string;
  };
  courts: Court[];
  bookmarksCount: number;
  totalBookings: number;
  totalOpenMatches: number;
  totalRevenue: number;
  isBookmarked: boolean;
  minutesBooked: number;
  avgRating: number;
  reviewsCount: number;
};
