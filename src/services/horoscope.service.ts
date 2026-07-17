import { ENDPOINTS } from "@/constants/api";
import { type LanguageCode } from "@/context/LanguageContext";
import { astroApi } from "@/services/apiClient";
import { ApiResponse } from "@/types/api";

export type HoroscopeSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type HoroscopePeriod = "daily" | "weekly" | "monthly" | "yearly";

export type HoroscopePredictionMap = Record<string, string | string[] | number | undefined>;

export type AstrologerHoroscope = {
  status?: boolean;
  sun_sign?: string;
  prediction_date?: string;
  prediction?: HoroscopePredictionMap;
};

export type DivineHoroscope = {
  success?: number;
  data?: DivineHoroscopeData;
};

export type DivineHoroscopeData = {
  sign?: string;
  date?: string;
  week?: string;
  month?: string;
  year?: string;
  prediction?: HoroscopePredictionMap;
  daily_horoscope?: HoroscopePredictionMap;
  weekly_horoscope?: HoroscopePredictionMap;
  monthly_horoscope?: HoroscopePredictionMap;
  yearly_horoscope?: HoroscopePredictionMap;
  special?: {
    lucky_color_codes?: string[];
    horoscope_percentage?: Record<string, number>;
  };
};

export type HoroscopeResponse = {
  astrology?: AstrologerHoroscope | null | string;
  divine?: DivineHoroscope;
};

const horoscopeEndpoints: Record<HoroscopePeriod, string> = {
  daily: ENDPOINTS.dailyHoroscope,
  weekly: ENDPOINTS.weeklyHoroscope,
  monthly: ENDPOINTS.monthlyHoroscope,
  yearly: ENDPOINTS.yearlyHoroscope
};

export async function getHoroscope(sign: HoroscopeSign, period: HoroscopePeriod, language: LanguageCode = "en") {
  const response = await astroApi.post<ApiResponse<HoroscopeResponse>>(horoscopeEndpoints[period], {
    sign,
    language
  });

  return ((response as unknown as ApiResponse<HoroscopeResponse>).data || response) as HoroscopeResponse;
}
