import { create } from "zustand";

import { KundaliPdfPayload, KundaliPdfResponse } from "@/services/kundali.service";

type KundaliState = {
  result: KundaliPdfResponse | null;
  request: KundaliPdfPayload | null;
  setResult: (result: KundaliPdfResponse, request?: KundaliPdfPayload) => void;
  clearResult: () => void;
};

export const useKundaliStore = create<KundaliState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
