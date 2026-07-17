import { create } from "zustand";

import { BasicAstroDetailsPayload, BasicAstroDetailsResponse } from "@/services/astroProfile.service";

type AstroProfileState = {
  result: BasicAstroDetailsResponse | null;
  request: BasicAstroDetailsPayload | null;
  setResult: (result: BasicAstroDetailsResponse, request?: BasicAstroDetailsPayload) => void;
  clearResult: () => void;
};

export const useAstroProfileStore = create<AstroProfileState>((set) => ({
  result: null,
  request: null,
  setResult: (result, request) => set((state) => ({ result, request: request || state.request })),
  clearResult: () => set({ result: null, request: null })
}));
