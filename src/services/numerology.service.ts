import { ENDPOINTS } from "@/constants/api";
import { astroApi } from "@/services/apiClient";
import { ApiResponse } from "@/types/api";

export type NumerologyPayload = {
  dob: string;
  fullName: string;
  gender: string;
};

export type LoShuGridResponse = {
  dob?: string;
  driverNumber?: number;
  destinyNumber?: number;
  runningAge?: number;
  kuaNumber?: number;
  nameNumber?: number;
  zodiacNumber?: number;
  zodiacSign?: string;
  missingNumbers?: number[];
  repeatedNumbers?: number[];
  counts?: Record<string, number>;
  grid?: {
    topRow?: string[];
    middleRow?: string[];
    bottomRow?: string[];
  };
};

export type PersonalYearResponse = {
  personalMonth?: string;
  personalDay?: string;
  personalYear?: string;
};

export type PersonalYearMatrixItem = {
  year: number;
  personalYear?: string;
  months?: {
    month?: string;
    personalYear?: string | number;
    personalMonth?: string | number;
  }[];
  personalMonths?: Record<string, string | number>;
  month?: Record<string, string | number>;
  personalMonth?: Record<string, string | number> | string | number;
  Jan?: string | number;
  Feb?: string | number;
  Mar?: string | number;
  Apr?: string | number;
  May?: string | number;
  Jun?: string | number;
  Jul?: string | number;
  Aug?: string | number;
  Sep?: string | number;
  Oct?: string | number;
  Nov?: string | number;
  Dec?: string | number;
  [key: string]:
    | string
    | number
    | Record<string, string | number>
    | { month?: string; personalYear?: string | number; personalMonth?: string | number }[]
    | undefined;
};

export async function getLoShuGrid(payload: NumerologyPayload) {
  const response = await astroApi.post<ApiResponse<LoShuGridResponse>>(ENDPOINTS.loShuGrid, payload);
  return ((response as unknown as ApiResponse<LoShuGridResponse>).data || response) as LoShuGridResponse;
}

export async function getPersonalYear(payload: NumerologyPayload) {
  const response = await astroApi.post<ApiResponse<PersonalYearResponse>>(ENDPOINTS.personalYear, payload);
  return ((response as unknown as ApiResponse<PersonalYearResponse>).data || response) as PersonalYearResponse;
}

export async function getPersonalYearMatrix(dob: string, fromYear: number, toYear: number) {
  const matrixQuery = new URLSearchParams({
    dob,
    fromYear: String(fromYear),
    toYear: String(toYear)
  });

  const response = await astroApi.get<ApiResponse<PersonalYearMatrixItem[]> | PersonalYearMatrixItem[]>(
    `${ENDPOINTS.personalYearMatrix}?${matrixQuery.toString()}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  return (Array.isArray(response) ? response : response.data || []) as PersonalYearMatrixItem[];
}
