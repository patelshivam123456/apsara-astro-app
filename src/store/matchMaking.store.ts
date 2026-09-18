import { create } from "zustand";

import { MatchMakingCombinedResponse, MatchMakingPdfPayload } from "@/services/kundali.service";

type MatchMakingState = {
  result: MatchMakingCombinedResponse | null;
  request: MatchMakingPdfPayload | null;
  setResult: (result: MatchMakingCombinedResponse, request?: MatchMakingPdfPayload) => void;
  clearResult: () => void;
};

export const useMatchMakingStore = create<MatchMakingState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
