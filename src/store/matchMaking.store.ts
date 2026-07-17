import { create } from "zustand";

import { KundaliPdfResponse, MatchMakingPdfPayload } from "@/services/kundali.service";

type MatchMakingState = {
  result: KundaliPdfResponse | null;
  request: MatchMakingPdfPayload | null;
  setResult: (result: KundaliPdfResponse, request?: MatchMakingPdfPayload) => void;
  clearResult: () => void;
};

export const useMatchMakingStore = create<MatchMakingState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
