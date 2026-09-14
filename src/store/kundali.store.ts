import { create } from "zustand";

import { KundaliBasicPayload, KundaliBasicResponse } from "@/services/kundali.service";

type KundaliState = {
  result: KundaliBasicResponse | null;
  request: KundaliBasicPayload | null;
  setResult: (result: KundaliBasicResponse, request?: KundaliBasicPayload) => void;
  clearResult: () => void;
};

export const useKundaliStore = create<KundaliState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
