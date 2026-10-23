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
  signIn: (username: string, password: string, channel?: "email" | "mobileNo", otp?: string) => Promise<void>;
  acceptSignupSession: (accessToken: string, claims: TokenClaims | null, signupProfile?: ClientProfile) => Promise<void>;
  restoreSession: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser) => void;
};

function rolesFromClaims(claims: TokenClaims | null) {
  return [...new Set([...normalizeRoles(claims?.roles), ...normalizeRoles(claims?.authorities)])];
}

function profileFromClaims(claims: TokenClaims | null, username = ""): ClientProfile {
  const identity = claims?.name || claims?.username || claims?.sub || username;
  const [firstName, ...lastParts] = identity.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: claims?.firstName || firstName || "",
    lastName: claims?.lastName || lastParts.join(" "),
    email: claims?.email || (identity.includes("@") ? identity : ""),
    mobileNo: claims?.mobileNo || claims?.phone || (/^\d{10,}$/.test(identity) ? identity : "")
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isAuthLoaded: false,
  accessToken: null,
  user: null,
  roles: [],
  async signIn(username, password, channel, otp) {
    const payload = channel === "mobileNo"
      ? { username, channel, otp }
      : { username, password, channel: "email" as const };
    const { accessToken, claims } = await loginRequest(payload);
    let user: AuthUser;
    try {
      const loaded = await loadSessionProfile(claims);
      user = hasProfileIdentity(loaded) ? loaded : profileFromClaims(claims, username);
    } catch {
      user = profileFromClaims(claims, username);
    }
    set({
      isLoggedIn: true,
      isAuthLoaded: true,
      accessToken,
      user,
      roles: rolesFromClaims(claims)
    });
  },
  async acceptSignupSession(accessToken, claims, signupProfile) {
    let user: AuthUser = profileFromClaims(claims);
    try {
      const loaded = await loadSessionProfile(claims);
      if (hasProfileIdentity(loaded)) user = { ...user, ...loaded };
    } catch {
      // Keep the identity returned during signup when profile loading is temporarily unavailable.
    }
    if (signupProfile) user = { ...user, ...signupProfile };
    set({ isLoggedIn: true, isAuthLoaded: true, accessToken, user, roles: rolesFromClaims(claims) });
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
      let user: AuthUser = profileFromClaims(claims);
      try {
        const loaded = await loadSessionProfile(claims);
        if (hasProfileIdentity(loaded)) user = { ...user, ...loaded };
      } catch {
        // Keep the saved session and use token identity if profile loading is unavailable.
      }
      set({
        isLoggedIn: true,
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

function hasProfileIdentity(user: AuthUser): user is Exclude<AuthUser, null> {
  if (!user) return false;
  const value = user as ClientProfile & Astrologer;
  return !!(value.firstName || value.fullName || value.displayName || value.email || value.mobileNo || value.phone);
}
