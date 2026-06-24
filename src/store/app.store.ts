import { create } from "zustand";

import { Astrologer } from "@/types/api";

type AppState = {
  selectedAstrologer?: Astrologer;
  bookingMode?: "chat" | "audio" | "video";
  setBooking: (astrologer: Astrologer, mode: "chat" | "audio" | "video") => void;
};

export const useAppStore = create<AppState>((set) => ({
  setBooking(astrologer, mode) {
    set({ selectedAstrologer: astrologer, bookingMode: mode });
  }
}));
