import { Court, Slot } from "models";
import { Item } from "utils";
import { create } from "zustand";

interface OpenMatchState {
  date?: string;
  court?: Court;
  selectGame?: Item;
  selectType?: Item;
  selectGender?: Item;
  autoAccept?: boolean;
  selectedSlots?: Slot[];
}

interface OpenMatchActions {
  setMatchData: (matchData: OpenMatchState) => void;
  clearMatchData: () => void;
}

export const useOpenMatchStore = create<OpenMatchState & OpenMatchActions>(
  (set) => ({
    date: undefined,
    court: undefined,
    selectGame: undefined,
    selectType: undefined,
    selectGender: undefined,
    autoAccept: false,
    setMatchData: (matchData: OpenMatchState) =>
      set((state) => ({
        ...state,
        ...matchData,
      })),
    clearMatchData: () =>
      set({
        date: undefined,
        court: undefined,
        selectGame: undefined,
        selectType: undefined,
        selectGender: undefined,
        autoAccept: false,
      }),
  })
);
