import { create } from "zustand";

import { loadSessionProfile, login as loginRequest, logout as logoutRequest } from "@/services/auth.service";
import { clearSecureTokens, getAccessToken, getStoredClaims, setStoredClaims } from "@/services/storage";
import { ClientProfile, Astrologer, TokenClaims } from "@/types/api";
import { decodeAccessToken, normalizeRoles } from "@/utils/jwt";

type AuthUser = ClientProfile | Astrologer | null;

type AuthState = {
  isLoggedIn: boolean;
  isAuthLoaded: boolean;
  accessToken: string | null;
  user: AuthUser;
  roles: string[];
  signIn: (username: string, password: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser) => void;
};

function rolesFromClaims(claims: TokenClaims | null) {
  return [...new Set([...normalizeRoles(claims?.roles), ...normalizeRoles(claims?.authorities)])];
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isAuthLoaded: false,
  accessToken: null,
  user: null,
  roles: [],
  async signIn(username, password) {
    const { accessToken, claims } = await loginRequest({ username, password });
    const user = await loadSessionProfile(claims);
    set({
      isLoggedIn: true,
      isAuthLoaded: true,
      accessToken,
      user,
      roles: rolesFromClaims(claims)
    });
  },
  async restoreSession() {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        set({ isLoggedIn: false, isAuthLoaded: true, accessToken: null, user: null, roles: [] });
        return;
      }

      const claims = decodeAccessToken(accessToken) || (await getStoredClaims<TokenClaims>());
      if (claims) await setStoredClaims(claims);
      const user = await loadSessionProfile(claims);
      set({
        isLoggedIn: !!user,
        isAuthLoaded: true,
        accessToken,
        user,
        roles: rolesFromClaims(claims)
      });
    } catch {
      await clearSecureTokens();
      set({ isLoggedIn: false, isAuthLoaded: true, accessToken: null, user: null, roles: [] });
    }
  },
  async signOut() {
    try {
      await logoutRequest();
    } finally {
      set({ isLoggedIn: false, isAuthLoaded: true, accessToken: null, user: null, roles: [] });
    }
  },
  setUser(user) {
    set({ user });
  }
}));
