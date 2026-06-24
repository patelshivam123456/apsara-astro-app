import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as
  | { apiUrl?: string; astroApiUrl?: string }
  | undefined;

export const API_BASE_URL = extra?.apiUrl || "http://localhost:5000/api";
export const ASTRO_API_BASE_URL = extra?.astroApiUrl || API_BASE_URL;

export const ENDPOINTS = {
  login: "/authorization/auth/login",
  signUp: "/authorization/auth/sign-up",
  createUser: "/authorization/auth/create-user",
  forgotPassword: "/authorization/auth/forgot-password",
  resetPassword: "/authorization/auth/reset-password",
  updatePassword: "/authorization/auth/update-password",
  refreshToken: "/authorization/auth/refresh-token",
  logout: "/authorization/auth/logout",
  clientProfile: "/authorization/client/profile-me",
  updateClientProfile: "/authorization/client/update-profile-data",
  deleteClientProfile: "/authorization/client/delete-profile-data",
  astrologerProfile: "/authorization/astrologer/profile-me",
  astrologerClients: "/authorization/astrologer/clients",
  astrologers: "/authorization/info/get-all-astrologers",
  loShu: "/astrology-services/home-page/lo-su",
  personalYear: "/astrology-services/home-page/personal-year"
} as const;
