import { Court, User, PaymentType, Slot } from "models";
import { Filters, Item, Location, OpenMatchData } from "utils";
import { create } from "zustand";

interface BookingDataType {
  court?: Court;
  timeSummary?: {
    date: Date;
    slots: Slot[];
  };
  participants?: User[];
  totalAmount?: number;
  paymentType?: PaymentType;
}

interface UserState {
  location?: Location;
  filters?: Filters;
  searchFilters?: Filters;
  bookingData?: BookingDataType;
  userSortSelection?: Item;
  openMatchData?: OpenMatchData;
  reportEntityId: string;
  profileId?: string;
}

interface UserActions {
  updateLocation: (newLocation: Location) => void;
  updateFilters: (newFilters: Filters) => void;
  clearFilters: () => void;
  updateSearchFilters: (newFilters?: Filters) => void;
  updateBooking: (booking: BookingDataType) => void;
  clearBooking: () => void;
  updateSortSelection: (selection: Item) => void;
  clearSportSelection: () => void;
  updateReportEntityId: (reportEntityId: string) => void;
  updateProfileId: (profileId: string) => void;
}

export const useUserStore = create<UserActions & UserState>((set) => ({
  searchFilters: undefined,
  reportEntityId: "",
  location: undefined,
  filters: undefined,
  userSortSelection: undefined,
  openMatchData: undefined,
  updateReportEntityId: (reportEntityId: string) =>
    set((state) => ({ ...state, reportEntityId })),
  clearSportSelection: () =>
    set((state) => ({
      ...state,
      userSortSelection: undefined,
    })),
  updateSortSelection: (selection: Item) =>
    set((state) => ({
      ...state,
      userSortSelection: selection,
    })),
  updateSearchFilters: (filters?: Filters) =>
    set((state) => ({
      ...state,
      searchFilters: filters
        ? { ...state.searchFilters, ...filters }
        : undefined,
    })),
  updateFilters: (newFilters: Filters) =>
    set((state) => ({
      ...state,
      filters: { ...state.filters, ...newFilters },
    })),
  clearFilters: () =>
    set((state) => ({
      ...state,
      filters: undefined,
    })),
  updateLocation: (newLocation: Location) =>
    set((state) => ({ ...state, location: newLocation })),
  bookingData: undefined,
  updateBooking: (booking: BookingDataType) =>
    set((state) => ({
      ...state,
      bookingData: { ...state.bookingData, ...booking },
    })),
  clearBooking: () =>
    set((state) => ({
      ...state,
      bookingData: undefined,
    })),
  updateProfileId: (profileId: string) =>
    set((state) => ({ ...state, profileId })),
}));
