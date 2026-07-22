import {
  AstrologerHoroscope,
  DivineHoroscopeData,
  HoroscopePeriod,
  HoroscopePredictionMap
} from "@/services/horoscope.service";

export function toTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function getAstrologerPrediction(astrology?: AstrologerHoroscope | null | string) {
  if (!astrology) return undefined;
  if (typeof astrology === "string") return normalizePrediction(astrology);
  if (Array.isArray(astrology)) return normalizePrediction(astrology);

  const prediction = firstPrediction(
    normalizePrediction(astrology.prediction),
    normalizePrediction(astrology.daily_horoscope),
    normalizePrediction(astrology.weekly_horoscope),
    normalizePrediction(astrology.monthly_horoscope),
    normalizePrediction(astrology.yearly_horoscope)
  );

  return prediction || normalizeAstrologerFields(astrology);
}

export function getAstrologerMeta(astrology?: AstrologerHoroscope | null | string) {
  if (!astrology || typeof astrology === "string" || Array.isArray(astrology)) return "";
  return [
    astrology.sun_sign,
    astrology.prediction_date,
    astrology.week_start_date,
    astrology.prediction_month,
    astrology.prediction_year,
    astrology.year
  ]
    .filter(Boolean)
    .join(" • ");
}

export function getDivinePrediction(divine?: DivineHoroscopeData, period?: HoroscopePeriod): HoroscopePredictionMap | undefined {
  if (!divine) return undefined;

  if (period === "weekly") return firstPrediction(divine.weekly_horoscope, divine.prediction);
  if (period === "monthly") return firstPrediction(divine.monthly_horoscope, divine.prediction);
  if (period === "yearly") return firstPrediction(divine.yearly_horoscope, divine.prediction);

  return firstPrediction(divine.prediction, divine.daily_horoscope);
}

export function getDivineMeta(divine?: DivineHoroscopeData) {
  if (!divine) return "";
  return [divine.sign, divine.date || divine.week || divine.month || divine.year].filter(Boolean).join(" • ");
}

export function hasPredictionEntries(prediction?: HoroscopePredictionMap) {
  return Boolean(
    prediction &&
      !Array.isArray(prediction) &&
      Object.values(prediction).some((value) => {
        if (Array.isArray(value)) return value.some((item) => item.trim());
        return value !== undefined && value !== "";
      })
  );
}

function firstPrediction(...predictions: (HoroscopePredictionMap | undefined)[]) {
  return predictions.find(hasPredictionEntries);
}

function normalizePrediction(prediction?: HoroscopePredictionMap | string[] | string) {
  if (typeof prediction === "string") {
    return prediction.trim() ? { prediction } : undefined;
  }

  if (Array.isArray(prediction)) {
    return prediction.some((item) => item.trim()) ? { prediction } : undefined;
  }

  return hasPredictionEntries(prediction) ? prediction : undefined;
}

function normalizeAstrologerFields(astrology: AstrologerHoroscope) {
  const ignoredKeys = new Set(["status", "sun_sign", "prediction_date", "week_start_date", "prediction_month", "prediction_year", "year"]);
  const entries: [string, string | string[] | number | undefined][] = [];

  Object.entries(astrology).forEach(([key, value]) => {
    if (ignoredKeys.has(key)) return;
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length) entries.push([key, value]);
      return;
    }
    if (typeof value === "object") {
      const normalized = normalizePrediction(value as HoroscopePredictionMap);
      if (normalized) entries.push(...Object.entries(normalized));
      return;
    }
    entries.push([key, String(value)]);
  });

  return entries.length ? (Object.fromEntries(entries) as HoroscopePredictionMap) : undefined;
}
