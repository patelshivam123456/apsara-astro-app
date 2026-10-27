export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://staging-api.apsraastro.com";

export const ASTRO_API_BASE_URL =
  process.env.EXPO_PUBLIC_ASTRO_API_URL || "https://staging-api.apsraastro.com";

export const TRANSACTION_API_BASE_URL =
  process.env.EXPO_PUBLIC_TRANSACTION_API_URL || "https://staging-api.apsraastro.com";

export const NUMEROLOGY_PDF_BASE_URL =
  process.env.EXPO_PUBLIC_NUMEROLOGY_PDF_BASE_URL ||
  (API_BASE_URL.includes("staging") ? "https://staging.apsraastro.in" : "https://apsraastro.com");

export const ENDPOINTS = {
  login: "/authorization/auth/login",
  signUp: "/authorization/auth/sign-up",
  createUser: "/authorization/auth/create-user",
  astrologerRegistration: "/authorization/auth/astrologer-registration",
  astrologerRegistrationOtpProcess: "/authorization/auth/astrologer-registration-otp-process",
  forgotPassword: "/authorization/auth/forgot-password",
  resetPassword: "/authorization/auth/reset-password",
  updatePassword: "/authorization/auth/update-password",
  refreshToken: "/authorization/auth/refresh-token",
  logout: "/authorization/auth/logout",
  clientProfile: "https://staging.apsraastro.in/api/proxy/authorization/client/profile-me",
  updateClientProfile: "https://staging.apsraastro.in/api/proxy/authorization/client/update-profile-data",
  deleteClientProfile: "/authorization/client/delete-profile-data",
  astrologerProfile: "/authorization/astrologer/profile-me",
  updateAstrologerProfile: "https://staging.apsraastro.in/api/proxy/authorization/astrologer/update-profile-data",
  astrologerClients: "/authorization/astrologer/clients",
  downloadFile: "/authorization/file/download-file",
  astrologers: "/authorization/info/get-all-astrologers",
  loShuGrid: "/astrology-services/home-page/lo-shu-grid",
  vedicGrid: "/astrology-services/home-page/vedic-grid",
  pythagoreanGrid: "/astrology-services/home-page/pythagorean-grid-details",
  pythagoreanNameTable: "/astrology-services/home-page/numerology/pythagorean/name-table",
  pythagoreanRunningAgeAlphabet: "/astrology-services/home-page/api/numerology/pythagorean/running-age-alphabet",
  chaldeanNamePairEvents: "/astrology-services/home-page/api/numerology/chaldean/name-pair-events",
  chaldeanNameLetterAnalysisChart: "/astrology-services/home-page/api/numerology/chaldean/name-letter-analysis-chart",
  nameFrequencyNameChart: "/astrology-services/home-page/api/numerology/name-frequency/name-chart",
  compatibilityGrid: "/astrology-services/numerology/match-making/compatibility-grid",
  mobileNumerology: "/astrology-services/numerology/mobile/analysis-report",
  numerologyPdf: "/api/numerology-pdf",
  dashaCalculation: "/astrology-services/home-page/numerology/dasha-calculation",
  pratyantarDasha: "/astrology-services/home-page/numerology/pratyantar-dasha",
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
  kundaliVerify: "https://staging.apsraastro.in/api/astro-proxy/astrology-services/kundali/v1/verify",
  kundaliBasic: "/astrology-services/kundali/v1/basic",
  kundaliYogas: "/astrology-services/kundali/v1/yogas",
  kundaliDosha: "/astrology-services/kundali/v1/dosha",
  kundaliBhinnashtakvarga: "/astrology-services/kundali/v1/bhinnashtakvarga",
  kundaliHoroscopeCharts: "/astrology-services/kundali/v1/horoscope-charts",
  kundaliKp: "/astrology-services/kundali/v1/kp",
  kundaliDasha: "/astrology-services/kundali/v1/dasha",
  kundaliJaimini: "https://staging.apsraastro.in/api/astro-proxy/astrology-services/kundali/v1/jaimini",
  kundaliPdf: "/astrology-services/kundali/v1/pdf",
  paymentInitiate: "/transactions/payment/v1/initiate",
  paymentAcknowledge: "/transactions/payment/v1/payment-acknowledge",
  matchMakingPdf: "/astrology-services/third-party/match-making-pdf",
  matchMakingOthers: "/astrology-services/match-making/v1/others",
  matchMakingHoroscopeCharts: "/astrology-services/match-making/v1/horoscope-charts",
  basicAstroDetails: "/astrology-services/third-party/basic-astro-details"
} as const;
