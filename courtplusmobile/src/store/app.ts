import { zustandStorage } from "utils";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AppState {
  isLoading: boolean;
  isBottomSheetOpen: boolean;
  bottomSheetChildren: React.ReactNode | null;
  showOnboarding: boolean;
  bottomSheetTitle: string;
  firstVisit: boolean;
  userTokens: Tokens;
  bottomSheetHorizontalPadding: boolean;
  userId: string;
  onDismiss: (() => void) | null;
  selectedCountryCode?: string;
  /** Booking ids whose post-game rate prompt was already shown/dismissed. */
  dismissedRatePromptIds: string[];
}

interface Actions {
  toggleLoading: (isLoading: boolean) => void;
  toggleBottomSheet: () => void;
  toggleShowOnboarding: () => void;
  setFirstVisit: () => void;
  setUserTokens: (newTokens: Tokens) => void;
  addDismissedRatePromptId: (bookingId: string) => void;
  setCustomBottomSheet: (
    children: React.ReactNode,
    title?: string,
    hasPaddingHorizontal?: boolean,
    onDismiss?: () => void
  ) => void;
  setSelectedCountryCode: (countryCode: string) => void;
}

export const useAppStore = create<
  Actions & AppState,
  [["zustand/persist", unknown]]
>(
  persist(
    (set) => ({
      userId: "",
      onDismiss: null,
      isLoading: false,
      firstVisit: true,
      bottomSheetHorizontalPadding: true,
      setSelectedCountryCode: (countryCode: string) =>
        set((state) => ({ ...state, selectedCountryCode: countryCode })),
      toggleLoading: (isLoading: boolean) =>
        set((state) => ({ ...state, isLoading: isLoading })),
      isBottomSheetOpen: false,
      toggleBottomSheet: () =>
        set((state) => ({
          ...state,
          isBottomSheetOpen: !state.isBottomSheetOpen,
        })),
      bottomSheetChildren: null,
      showOnboarding: false,
      toggleShowOnboarding: () =>
        set((state) => ({
          ...state,
          showOnboarding: !state.showOnboarding,
        })),
      bottomSheetTitle: "",
      setFirstVisit: () =>
        set((state) => ({
          ...state,
          firstVisit: !state.firstVisit,
        })),
      userTokens: {
        accessToken: "",
        refreshToken: "",
      },
      dismissedRatePromptIds: [],
      addDismissedRatePromptId: (bookingId) =>
        set((state) => ({
          ...state,
          dismissedRatePromptIds: state.dismissedRatePromptIds.includes(
            bookingId
          )
            ? state.dismissedRatePromptIds
            : [...state.dismissedRatePromptIds, bookingId],
        })),
      setUserTokens: (newTokens) =>
        set((state) => ({
          ...state,
          userTokens: newTokens,
        })),
      setCustomBottomSheet: (
        children,
        title,
        hasPaddingHorizontal = true,
        onDismiss
      ) =>
        set((state) => ({
          ...state,
          bottomSheetTitle: title ?? "",
          bottomSheetChildren: children,
          isBottomSheetOpen: true,
          bottomSheetHorizontalPadding: hasPaddingHorizontal,
          onDismiss: onDismiss,
        })),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        firstVisit: state.firstVisit,
        userTokens: state.userTokens,
        userId: state.userId,
        dismissedRatePromptIds: state.dismissedRatePromptIds,
      }),
    }
  )
);
