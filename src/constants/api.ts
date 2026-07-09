export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://66.116.242.35:8080";

export const ASTRO_API_BASE_URL =
  process.env.EXPO_PUBLIC_ASTRO_API_URL || "http://66.116.242.35:8085";

export const ENDPOINTS = {
  login: "/authorization/auth/login",
  createUser: "/authorization/auth/create-user",
  astrologerRegistration: "/authorization/auth/astrologer-registration",
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
  loShuGrid: "/astrology-services/home-page/lo-shu-grid",
  personalityDestinyDetails: "/astrology-services/home-page/personality-destiny-details",
  numberRelationships: "/astrology-services/home-page/number-relationships",
  sectorWiseEffects: "/astrology-services/home-page/get-sector-wise-effects",
  personalYear: "/astrology-services/home-page/personal-year",
  personalYearMatrix: "/astrology-services/home-page/personal-year-matrix"
} as const;
