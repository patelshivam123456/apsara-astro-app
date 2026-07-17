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
  if (!astrology || typeof astrology === "string" || Array.isArray(astrology)) return undefined;
  return hasPredictionEntries(astrology.prediction) ? astrology.prediction : undefined;
}

export function getAstrologerMeta(astrology?: AstrologerHoroscope | null | string) {
  if (!astrology || typeof astrology === "string" || Array.isArray(astrology)) return "";
  return [astrology.sun_sign, astrology.prediction_date].filter(Boolean).join(" • ");
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
