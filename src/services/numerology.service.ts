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

export type PersonalityDestinyType = "PERSONALITY" | "DESTINY";

export type PersonalityDestinyItem = {
  type?: PersonalityDestinyType;
  numberValue?: number;
  lord?: string;
  colour?: string;
  value?: string | null;
};

export type PersonalityDestinyDetailsResponse = {
  coreCharacteristics?: PersonalityDestinyItem[];
  commonPitfalls?: PersonalityDestinyItem[];
  primaryHealthVulnerabilities?: PersonalityDestinyItem[];
  [key: string]: PersonalityDestinyItem[] | undefined;
};

export type NumberRelationshipItem = {
  id?: number;
  planetNumber?: number;
  friendNumbers?: string;
  enemyNumbers?: string;
  neutralNumbers?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SectorWiseEffectsResponse = {
  id?: number;
  combinationKey?: string;
  personalityNumber?: number;
  destinyNumber?: number;
  careerEffect?: string;
  healthEffect?: string;
  financeEffect?: string;
  relationshipEffect?: string;
  rawText?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type LoShuRepetitionCountsPayload = Record<"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9", number>;

export type LoShuRepetitionEffectItem = {
  id?: number;
  loShuNumber?: number;
  gridRow?: number;
  gridColumn?: number;
  repetitionStatus?: string;
  repetitionCount?: number;
  title?: string;
  meaning?: string;
  generalNote?: string;
};

export async function getLoShuGrid(payload: NumerologyPayload) {
  const response = await astroApi.post<ApiResponse<LoShuGridResponse>>(ENDPOINTS.loShuGrid, payload);
  return ((response as unknown as ApiResponse<LoShuGridResponse>).data || response) as LoShuGridResponse;
}

export async function getPersonalityDestinyDetails(type: PersonalityDestinyType, number: number) {
  const query = new URLSearchParams({
    type,
    number: String(number)
  });

  const response = await astroApi.get<ApiResponse<PersonalityDestinyDetailsResponse>>(
    `${ENDPOINTS.personalityDestinyDetails}?${query.toString()}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  return ((response as unknown as ApiResponse<PersonalityDestinyDetailsResponse>).data || response) as PersonalityDestinyDetailsResponse;
}

export async function getNumberRelationships(personalityNo: number, destinyNo: number) {
  const query = new URLSearchParams({
    personalityNo: String(personalityNo),
    destinyNo: String(destinyNo)
  });

  const response = await astroApi.get<ApiResponse<NumberRelationshipItem[]>>(
    `${ENDPOINTS.numberRelationships}?${query.toString()}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  return ((response as unknown as ApiResponse<NumberRelationshipItem[]>).data || []) as NumberRelationshipItem[];
}

export async function getSectorWiseEffects(personalityNo: number, destinyNo: number) {
  const query = new URLSearchParams({
    personalityNo: String(personalityNo),
    destinyNo: String(destinyNo)
  });

  const response = await astroApi.get<ApiResponse<SectorWiseEffectsResponse>>(
    `${ENDPOINTS.sectorWiseEffects}?${query.toString()}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  return ((response as unknown as ApiResponse<SectorWiseEffectsResponse>).data || response) as SectorWiseEffectsResponse;
}

export async function getLoShuRepetitionEffects(payload: LoShuRepetitionCountsPayload) {
  const response = await astroApi.post<ApiResponse<LoShuRepetitionEffectItem[]>>(ENDPOINTS.loShuRepetitionEffects, payload);
  return ((response as unknown as ApiResponse<LoShuRepetitionEffectItem[]>).data || []) as LoShuRepetitionEffectItem[];
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
