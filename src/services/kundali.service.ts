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

export type KundaliPdfPayload = {
  birth: {
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
  branding: {
    chartStyle: ChartStyle;
  };
  language?: string;
  languageCode?: LanguageCode;
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

export async function getGeolocationPlaces(birthPlace: string) {
  const query = new URLSearchParams({ birthPlace });
  const response = await astroApi.get<ApiResponse<GeoLocationPlace[]>>(`${ENDPOINTS.geolocation}?${query.toString()}`);
  return ((response as unknown as ApiResponse<GeoLocationPlace[]>).data || []) as GeoLocationPlace[];
}

export async function generateKundaliPdf(payload: KundaliPdfPayload) {
  const response = await astroApi.post<ApiResponse<KundaliPdfResponse>>(ENDPOINTS.kundaliPdf, payload, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json"
    }
  });

  return ((response as unknown as ApiResponse<KundaliPdfResponse>).data || response) as KundaliPdfResponse;
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
