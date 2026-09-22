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
  const data = normalizeHoroscopeResponse(((response as unknown as ApiResponse<unknown>).data || response) as unknown, period);

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

function normalizeHoroscopeResponse(value: unknown, period: HoroscopePeriod): HoroscopeResponse {
  if (isRecord(value) && (value.astrology !== undefined || value.divine !== undefined)) {
    return value as HoroscopeResponse;
  }

  const divineData = extractDivineHoroscopeData(value, period);
  if (!divineData) return {};

  return {
    astrology: toAstrologerHoroscope(divineData, period),
    divine: {
      success: 1,
      data: divineData
    }
  };
}

function extractDivineHoroscopeData(value: unknown, period: HoroscopePeriod): DivineHoroscopeData | null {
  const unwrapped = unwrapResponseData(value);
  if (!isRecord(unwrapped)) return null;

  const prediction = getPeriodPrediction(unwrapped, period);
  if (!prediction) return null;

  return {
    sign: getString(unwrapped.sign),
    date: getString(unwrapped.date),
    week: getString(unwrapped.week),
    month: getString(unwrapped.month),
    year: getString(unwrapped.year),
    prediction,
    daily_horoscope: period === "daily" ? prediction : getPredictionMap(unwrapped.daily_horoscope),
    weekly_horoscope: period === "weekly" ? prediction : getPredictionMap(unwrapped.weekly_horoscope),
    monthly_horoscope: period === "monthly" ? prediction : getPredictionMap(unwrapped.monthly_horoscope),
    yearly_horoscope: period === "yearly" ? prediction : getPredictionMap(unwrapped.yearly_horoscope),
    special: normalizeSpecial(unwrapped.special)
  };
}

function unwrapResponseData(value: unknown): unknown {
  let current = value;
  while (isRecord(current) && isRecord(current.data)) {
    current = current.data;
  }
  return current;
}

function getPeriodPrediction(record: Record<string, unknown>, period: HoroscopePeriod) {
  const key = period === "daily" ? "prediction" : `${period}_horoscope`;
  return getPredictionMap(record[key]) || getPredictionMap(record.prediction);
}

function getPredictionMap(value: unknown): HoroscopePredictionMap | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(([, item]) => (
    typeof item === "string" ||
    typeof item === "number" ||
    Array.isArray(item)
  ));

  return entries.length ? (Object.fromEntries(entries) as HoroscopePredictionMap) : undefined;
}

function normalizeSpecial(value: unknown): DivineHoroscopeData["special"] {
  if (!isRecord(value)) return undefined;

  const luckyColorCodes = Array.isArray(value.lucky_color_codes)
    ? value.lucky_color_codes.filter((item): item is string => typeof item === "string")
    : undefined;
  const horoscopePercentage = isRecord(value.horoscope_percentage)
    ? Object.fromEntries(
        Object.entries(value.horoscope_percentage)
          .map(([key, item]) => [key, Number(item)])
          .filter(([, item]) => Number.isFinite(item))
      )
    : undefined;

  if (!luckyColorCodes?.length && !horoscopePercentage) return undefined;

  return {
    lucky_color_codes: luckyColorCodes,
    horoscope_percentage: horoscopePercentage
  };
}

function toAstrologerHoroscope(divineData: DivineHoroscopeData, period: HoroscopePeriod): AstrologerHoroscope {
  const prediction = getDivinePeriodPrediction(divineData, period);

  return {
    status: true,
    sun_sign: divineData.sign,
    prediction_date: divineData.date,
    week_start_date: divineData.week,
    prediction_month: divineData.month,
    prediction_year: divineData.year,
    year: divineData.year,
    prediction,
    daily_horoscope: divineData.daily_horoscope,
    weekly_horoscope: divineData.weekly_horoscope,
    monthly_horoscope: divineData.monthly_horoscope,
    yearly_horoscope: divineData.yearly_horoscope
  };
}

function getDivinePeriodPrediction(divineData: DivineHoroscopeData, period: HoroscopePeriod) {
  if (period === "weekly") return divineData.weekly_horoscope || divineData.prediction;
  if (period === "monthly") return divineData.monthly_horoscope || divineData.prediction;
  if (period === "yearly") return divineData.yearly_horoscope || divineData.prediction;
  return divineData.prediction || divineData.daily_horoscope;
}

function getString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
