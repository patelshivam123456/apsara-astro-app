import { useEffect, useMemo, useState } from "react";

import { type LanguageCode } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  getLoShuGrid,
  getLoShuRepetitionEffects,
  getNumberRelationships,
  getPersonalYear,
  getPersonalYearMatrix,
  getSectorWiseEffects,
  LoShuGridResponse,
  LoShuRepetitionEffectItem,
  NumberRelationshipItem,
  PersonalYearMatrixItem,
  PersonalYearResponse,
  SectorWiseEffectsResponse
} from "@/services/numerology.service";

import { buildLoShuCountsPayload, translateSectorWiseEffects } from "./utils";

export function useNumerologyReport({
  dob,
  fullName,
  gender,
  language
}: {
  dob: string;
  fullName: string;
  gender: string;
  language: LanguageCode;
}) {
  const currentYear = new Date().getFullYear();
  const [loShu, setLoShu] = useState<LoShuGridResponse | null>(null);
  const [personalYear, setPersonalYear] = useState<PersonalYearResponse | null>(null);
  const [matrix, setMatrix] = useState<PersonalYearMatrixItem[]>([]);
  const [relationships, setRelationships] = useState<NumberRelationshipItem[]>([]);
  const [sectorEffects, setSectorEffects] = useState<SectorWiseEffectsResponse | null>(null);
  const [repetitionEffects, setRepetitionEffects] = useState<LoShuRepetitionEffectItem[]>([]);
  const [translatedSectorEffects, setTranslatedSectorEffects] = useState<Partial<Record<LanguageCode, SectorWiseEffectsResponse>>>({});
  const [sectorTranslating, setSectorTranslating] = useState(false);
  const [fromYear, setFromYear] = useState(String(currentYear));
  const [toYear, setToYear] = useState(String(currentYear + 10));
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);

  useEffect(() => {
    let mounted = true;
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        const grid = await getLoShuGrid(payload);
        if (!mounted) return;
        setLoShu(grid);
        const personalityNo = Number(grid.driverNumber);
        const destinyNo = Number(grid.destinyNumber);
        const repetitionPayload = buildLoShuCountsPayload(grid.counts);
        const [year, yearMatrix, relationshipRows, effects, repetitionRows] = await Promise.all([
          getPersonalYear(payload),
          getPersonalYearMatrix(dob, currentYear, currentYear + 10),
          Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
            ? getNumberRelationships(personalityNo, destinyNo)
            : Promise.resolve([]),
          Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
            ? getSectorWiseEffects(personalityNo, destinyNo)
            : Promise.resolve(null),
          repetitionPayload ? getLoShuRepetitionEffects(repetitionPayload) : Promise.resolve([])
        ]);
        if (!mounted) return;
        setPersonalYear(year);
        setMatrix(yearMatrix);
        setRelationships(relationshipRows);
        setSectorEffects(effects);
        setRepetitionEffects(repetitionRows);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load numerology report"));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadReport();
    return () => {
      mounted = false;
    };
  }, [currentYear, dob, payload]);

  const translatedCurrentSectorEffects = translatedSectorEffects[language];
  const currentSectorEffects = language === "en" ? sectorEffects : translatedCurrentSectorEffects || null;

  useEffect(() => {
    let mounted = true;

    async function translateSectorEffects() {
      if (language === "en" || !sectorEffects || translatedCurrentSectorEffects) {
        setSectorTranslating(false);
        return;
      }

      try {
        setSectorTranslating(true);
        const nextEffects = await translateSectorWiseEffects(sectorEffects, language);
        if (!mounted) return;
        setTranslatedSectorEffects((current) => ({
          ...current,
          [language]: nextEffects
        }));
      } finally {
        if (mounted) setSectorTranslating(false);
      }
    }

    translateSectorEffects();
    return () => {
      mounted = false;
    };
  }, [language, sectorEffects, translatedCurrentSectorEffects]);

  const refreshMatrix = async () => {
    const from = Number(fromYear);
    const to = Number(toYear);
    if (!Number.isInteger(from) || !Number.isInteger(to) || to < from || to - from > 10) {
      setError("From Year and To Year must be valid, with a maximum 10 year gap.");
      return;
    }
    try {
      setMatrixLoading(true);
      setError(null);
      setMatrix(await getPersonalYearMatrix(dob, from, to));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load personal year matrix"));
    } finally {
      setMatrixLoading(false);
    }
  };

  return {
    currentSectorEffects,
    error,
    fromYear,
    loading,
    loShu,
    matrix,
    matrixLoading,
    personalYear,
    refreshMatrix,
    relationships,
    repetitionEffects,
    sectorTranslating,
    setFromYear,
    setToYear,
    toYear
  };
}
