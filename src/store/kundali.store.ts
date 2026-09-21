import { create } from "zustand";

import { KundaliBasicPayload, KundaliCombinedResponse } from "@/services/kundali.service";

type KundaliState = {
  result: KundaliCombinedResponse | null;
  request: KundaliBasicPayload | null;
  setResult: (result: KundaliCombinedResponse, request?: KundaliBasicPayload) => void;
  clearResult: () => void;
};

export const useKundaliStore = create<KundaliState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
