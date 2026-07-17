export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://apsraastro.com";

export const ASTRO_API_BASE_URL =
  process.env.EXPO_PUBLIC_ASTRO_API_URL || "https://apsraastro.com";

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
  vedicGrid: "/astrology-services/home-page/vedic-grid",
  personalityDestinyDetails: "/astrology-services/home-page/personality-destiny-details",
  numberRelationships: "/astrology-services/home-page/number-relationships",
  sectorWiseEffects: "/astrology-services/home-page/get-sector-wise-effects",
  loShuRepetitionEffects: "/astrology-services/home-page/get-loshu-repetition-effects",
  personalYear: "/astrology-services/home-page/personal-year",
  personalYearMatrix: "/astrology-services/home-page/personal-year-matrix",
  dailyHoroscope: "/astrology-services/third-party/daily-horoscope",
  weeklyHoroscope: "/astrology-services/third-party/weekly-horoscope",
  monthlyHoroscope: "/astrology-services/third-party/monthly-horoscope",
  yearlyHoroscope: "/astrology-services/third-party/yearly-horoscope",
  geolocation: "/astrology-services/home-page/get-geolocation",
  kundaliPdf: "/astrology-services/third-party/kundali-pdf",
  matchMakingPdf: "/astrology-services/third-party/match-making-pdf",
  basicAstroDetails: "/astrology-services/third-party/basic-astro-details"
} as const;
