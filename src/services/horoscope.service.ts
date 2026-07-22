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
type AstrologerPrediction = HoroscopePredictionMap | string[] | string;

export type AstrologerHoroscope = {
  status?: boolean;
  sun_sign?: string;
  prediction_date?: string;
  week_start_date?: string;
  prediction_month?: string;
  prediction_year?: string;
  year?: string;
  prediction?: AstrologerPrediction;
  daily_horoscope?: AstrologerPrediction;
  weekly_horoscope?: AstrologerPrediction;
  monthly_horoscope?: AstrologerPrediction;
  yearly_horoscope?: AstrologerPrediction;
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
  const endpoint = horoscopeEndpoints[period];
  const payload = {
    sign,
    language
  };

  console.log(`[horoscope.${period}.request]`, {
    period,
    endpoint,
    payload
  });

  const response = await astroApi.post<ApiResponse<HoroscopeResponse>>(endpoint, payload);
  const data = ((response as unknown as ApiResponse<HoroscopeResponse>).data || response) as HoroscopeResponse;

  console.log(`[horoscope.${period}.response]`, {
    period,
    endpoint,
    hasAstrology: Boolean(data?.astrology),
    astrologyType: Array.isArray(data?.astrology) ? "array" : typeof data?.astrology,
    astrologyKeys:
      data?.astrology && typeof data.astrology === "object" && !Array.isArray(data.astrology)
        ? Object.keys(data.astrology)
        : [],
    hasDivine: Boolean(data?.divine),
    divineSuccess: data?.divine?.success,
    divineDataKeys: data?.divine?.data ? Object.keys(data.divine.data) : []
  });

  return data;
}
