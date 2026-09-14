import { ENDPOINTS } from "@/constants/api";
import { type LanguageCode } from "@/context/LanguageContext";
import { astroApi } from "@/services/apiClient";
import { ApiResponse } from "@/types/api";

export type ChartStyle = "NORTH_INDIAN" | "SOUTH_INDIAN" | "EAST_INDIAN" | "WEST_INDIAN";

export type GeoLocationPlace = {
  placeName: string;
  latitude: string;
  longitude: string;
  countryName?: string;
  countryCode?: string;
  timezoneId?: string;
};

export type KundaliBasicPayload = {
  fullName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  gender: string;
  place: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  language: string;
};

export type MatchMakingPersonPayload = {
  firstName: string;
  lastName: string;
  fullName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  lat: string;
  lon: string;
  gender: string;
  place: string;
};

export type MatchMakingPdfPayload = {
  p1: MatchMakingPersonPayload;
  p2: MatchMakingPersonPayload;
  options: {
    ashtakoot: "true" | "false";
    dashakoot: "true" | "false";
    papasamyam: "true" | "false";
  };
  branding: {
    chartStyle: ChartStyle;
  };
  language?: string;
  languageCode?: LanguageCode;
};

export type KundaliPdfResponse = {
  astrology?: {
    status?: boolean;
    pdf_url?: string;
    msg?: string;
  };
  divine?: {
    status?: string;
    code?: number;
    data?: {
      name?: string;
      report_url?: string;
      download_url?: string;
    };
    message?: string;
  };
};

export type KundaliPlanet = {
  name?: string;
  name_lan?: string;
  full_degree?: string;
  speed?: string;
  is_retro?: string;
  is_combusted?: string;
  longitude?: string;
  sign?: string;
  sign_no?: number;
  rashi_lord?: string;
  nakshatra?: string;
  nakshatra_pada?: number;
  nakshatra_no?: number;
  nakshatra_lord?: string;
  sub_lord?: string;
  awastha?: string;
  karakamsha?: string;
  house?: number;
  type?: string;
  lord_of?: string;
  image?: string;
};

export type KundaliBasicAstroDetails = {
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

export type KundaliBasicResponse = {
  planetaryPositions?: {
    date?: string;
    time?: string;
    latitude?: string;
    longitude?: string;
    timezone?: string;
    planets?: KundaliPlanet[];
  };
  basicAstroDetails?: KundaliBasicAstroDetails;
};

export async function getGeolocationPlaces(birthPlace: string) {
  const query = new URLSearchParams({ birthPlace });
  const response = await astroApi.get<ApiResponse<GeoLocationPlace[]>>(`${ENDPOINTS.geolocation}?${query.toString()}`);
  return ((response as unknown as ApiResponse<GeoLocationPlace[]>).data || []) as GeoLocationPlace[];
}

export async function getKundaliBasicDetails(payload: KundaliBasicPayload) {
  const response = await astroApi.post<ApiResponse<KundaliBasicResponse>>(ENDPOINTS.kundaliBasic, payload, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json"
    }
  });

  return ((response as unknown as ApiResponse<KundaliBasicResponse>).data || response) as KundaliBasicResponse;
}

export async function generateMatchMakingPdf(payload: MatchMakingPdfPayload) {
  const response = await astroApi.post<ApiResponse<KundaliPdfResponse>>(ENDPOINTS.matchMakingPdf, payload, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json"
    }
  });

  return ((response as unknown as ApiResponse<KundaliPdfResponse>).data || response) as KundaliPdfResponse;
}
