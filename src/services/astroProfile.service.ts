import { ENDPOINTS } from "@/constants/api";
import { type LanguageCode } from "@/context/LanguageContext";
import { astroApi } from "@/services/apiClient";
import { GeoLocationPlace } from "@/services/kundali.service";
import { ApiResponse } from "@/types/api";

export type BasicAstroBirthPayload = {
  fullName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  gender: string;
  place: string;
  lat: string;
  lon: string;
};

export type BasicAstroDetailsPayload = {
  birth: BasicAstroBirthPayload;
  language?: string;
  languageCode?: LanguageCode;
};

export type BasicAstroDetails = {
  full_name?: string;
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  gender?: string;
  place?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  sunrise?: string;
  sunset?: string;
  tithi?: string;
  paksha?: string;
  paya?: {
    type?: string;
    result?: string;
  };
  sunsign?: string;
  moonsign?: string;
  rashi_akshar?: string;
  chandramasa?: string;
  tatva?: string;
  prahar?: number;
  nakshatra?: string;
  vaar?: string;
  varna?: string;
  vashya?: string;
  yoni?: string;
  gana?: string;
  nadi?: string;
  yoga?: string;
  karana?: string;
  ayanamsha?: string;
  yunja?: string;
};

export type BasicAstroDetailsResponse = {
  astrology?: unknown;
  divine?: {
    success?: number;
    data?: BasicAstroDetails;
    message?: string;
  };
};

export function toBasicAstroBirthPayload(form: Omit<BasicAstroBirthPayload, "lat" | "lon" | "place"> & { place: string }, place: GeoLocationPlace): BasicAstroBirthPayload {
  return {
    fullName: form.fullName.trim(),
    day: form.day.trim(),
    month: form.month.trim(),
    year: form.year.trim(),
    hour: form.hour.trim(),
    min: form.min.trim(),
    sec: form.sec.trim() || "0",
    gender: form.gender,
    place: place.placeName,
    lat: place.latitude,
    lon: place.longitude
  };
}

export async function getBasicAstroDetails(payload: BasicAstroDetailsPayload) {
  const response = await astroApi.post<ApiResponse<BasicAstroDetailsResponse>>(ENDPOINTS.basicAstroDetails, payload, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json"
    }
  });

  return ((response as unknown as ApiResponse<BasicAstroDetailsResponse>).data || response) as BasicAstroDetailsResponse;
}
