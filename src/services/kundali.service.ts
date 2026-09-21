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
  fullName: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  min: string;
  sec: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  gender: string;
  place: string;
};

export type MatchMakingPdfPayload = {
  p1FullName: string;
  p1Day: string;
  p1Month: string;
  p1Year: string;
  p1Hour: string;
  p1Min: string;
  p1Sec: string;
  p1Gender: string;
  p1Place: string;
  p1Latitude: string;
  p1Longitude: string;
  p1TimeZone: string;
  p2FullName: string;
  p2Day: string;
  p2Month: string;
  p2Year: string;
  p2Hour: string;
  p2Min: string;
  p2Sec: string;
  p2Gender: string;
  p2Place: string;
  p2Latitude: string;
  p2Longitude: string;
  p2TimeZone: string;
  language?: string;
  languageCode?: LanguageCode;
};

export type MatchMakingReportResponse = Record<string, unknown>;

export type MatchMakingCombinedResponse = {
  others?: MatchMakingReportResponse;
  horoscopeCharts?: MatchMakingReportResponse;
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

export type KundaliReportResponse = Record<string, unknown>;

export type KundaliCombinedResponse = {
  basic?: KundaliBasicResponse;
  horoscopeCharts?: KundaliReportResponse;
  dasha?: KundaliReportResponse;
  kp?: KundaliReportResponse;
  bhinnashtakvarga?: KundaliReportResponse;
  yogas?: KundaliReportResponse;
  dosha?: KundaliReportResponse;
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

export async function generateKundaliReport(payload: KundaliBasicPayload) {
  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json"
  };

  const [
    basicResponse,
    horoscopeChartsResponse,
    dashaResponse,
    kpResponse,
    bhinnashtakvargaResponse,
    yogasResponse,
    doshaResponse
  ] = await Promise.all([
    astroApi.post<ApiResponse<KundaliBasicResponse>>(ENDPOINTS.kundaliBasic, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliHoroscopeCharts, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliDasha, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliKp, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliBhinnashtakvarga, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliYogas, payload, { headers }),
    astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliDosha, payload, { headers })
  ]);

  return {
    basic: ((basicResponse as unknown as ApiResponse<KundaliBasicResponse>).data || basicResponse) as KundaliBasicResponse,
    horoscopeCharts: ((horoscopeChartsResponse as unknown as ApiResponse<KundaliReportResponse>).data || horoscopeChartsResponse) as KundaliReportResponse,
    dasha: ((dashaResponse as unknown as ApiResponse<KundaliReportResponse>).data || dashaResponse) as KundaliReportResponse,
    kp: ((kpResponse as unknown as ApiResponse<KundaliReportResponse>).data || kpResponse) as KundaliReportResponse,
    bhinnashtakvarga: ((bhinnashtakvargaResponse as unknown as ApiResponse<KundaliReportResponse>).data || bhinnashtakvargaResponse) as KundaliReportResponse,
    yogas: ((yogasResponse as unknown as ApiResponse<KundaliReportResponse>).data || yogasResponse) as KundaliReportResponse,
    dosha: ((doshaResponse as unknown as ApiResponse<KundaliReportResponse>).data || doshaResponse) as KundaliReportResponse
  };
}

export async function generateMatchMakingPdf(payload: MatchMakingPdfPayload) {
  const [othersResponse, horoscopeChartsResponse, p1DashaResponse, p2DashaResponse] = await Promise.all([
    astroApi.post<ApiResponse<MatchMakingReportResponse>>(ENDPOINTS.matchMakingOthers, payload, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json"
      }
    }),
    astroApi.post<ApiResponse<MatchMakingReportResponse>>(ENDPOINTS.matchMakingHoroscopeCharts, payload, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json"
      }
    }),
    fetchMatchPersonDasha(toKundaliPayload(payload, "p1")),
    fetchMatchPersonDasha(toKundaliPayload(payload, "p2"))
  ]);

  const others = ((othersResponse as unknown as ApiResponse<MatchMakingReportResponse>).data || othersResponse) as MatchMakingReportResponse;

  return {
    others: enrichMatchMakingVimshottari(others, p1DashaResponse, p2DashaResponse),
    horoscopeCharts: ((horoscopeChartsResponse as unknown as ApiResponse<MatchMakingReportResponse>).data || horoscopeChartsResponse) as MatchMakingReportResponse
  };
}

async function fetchMatchPersonDasha(payload: KundaliBasicPayload) {
  try {
    const response = await astroApi.post<ApiResponse<KundaliReportResponse>>(ENDPOINTS.kundaliDasha, payload, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json"
      }
    });
    return ((response as unknown as ApiResponse<KundaliReportResponse>).data || response) as KundaliReportResponse;
  } catch {
    return null;
  }
}

function toKundaliPayload(payload: MatchMakingPdfPayload, person: "p1" | "p2"): KundaliBasicPayload {
  const prefix = person === "p1" ? "p1" : "p2";
  return {
    fullName: payload[`${prefix}FullName`],
    day: payload[`${prefix}Day`],
    month: payload[`${prefix}Month`],
    year: payload[`${prefix}Year`],
    hour: payload[`${prefix}Hour`],
    min: payload[`${prefix}Min`],
    sec: payload[`${prefix}Sec`],
    gender: payload[`${prefix}Gender`],
    place: payload[`${prefix}Place`],
    latitude: payload[`${prefix}Latitude`],
    longitude: payload[`${prefix}Longitude`],
    timeZone: payload[`${prefix}TimeZone`],
    language: payload.language || payload.languageCode || "en"
  };
}

function enrichMatchMakingVimshottari(
  others: MatchMakingReportResponse,
  p1Dasha: KundaliReportResponse | null,
  p2Dasha: KundaliReportResponse | null
): MatchMakingReportResponse {
  const current = isPlainRecord(others.vimshottariDasha) ? others.vimshottariDasha : {};
  const p1 = extractPratyantarDasha(p1Dasha) || current.p1;
  const p2 = extractPratyantarDasha(p2Dasha) || current.p2;
  if (!p1 && !p2) return others;

  return {
    ...others,
    vimshottariDasha: {
      ...current,
      ...(p1 ? { p1 } : {}),
      ...(p2 ? { p2 } : {})
    }
  };
}

function extractPratyantarDasha(value: KundaliReportResponse | null): unknown {
  if (!isPlainRecord(value)) return null;
  const data = isPlainRecord(value.data) ? value.data : value;
  const dashas = isPlainRecord(data.dashas) ? data.dashas : data;
  return dashas.pratyantarDasha || dashas.pratyantar_dasha || null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function generateLegacyMatchMakingPdf(payload: unknown) {
  const response = await astroApi.post<ApiResponse<KundaliPdfResponse>>(ENDPOINTS.matchMakingPdf, payload, {
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json"
    }
  });

  return ((response as unknown as ApiResponse<KundaliPdfResponse>).data || response) as KundaliPdfResponse;
}
