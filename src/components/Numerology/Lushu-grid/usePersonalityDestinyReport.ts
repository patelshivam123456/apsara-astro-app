import { useEffect, useState } from "react";

import { type LanguageCode } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  getPersonalityDestinyDetails,
  PersonalityDestinyDetailsResponse,
  PersonalityDestinyType
} from "@/services/numerology.service";

import { translatePersonalityDestinyDetails } from "./utils";

export function usePersonalityDestinyReport({
  activeNumber,
  activeTab,
  language
}: {
  activeNumber: number;
  activeTab: PersonalityDestinyType;
  language: LanguageCode;
}) {
  const [rawDetails, setRawDetails] = useState<Partial<Record<PersonalityDestinyType, PersonalityDestinyDetailsResponse>>>({});
  const [translatedDetails, setTranslatedDetails] = useState<
    Partial<Record<PersonalityDestinyType, Partial<Record<LanguageCode, PersonalityDestinyDetailsResponse>>>>
  >({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDetails() {
      if (!Number.isFinite(activeNumber) || activeNumber <= 0) {
        setError(`Unable to find ${activeTab.toLowerCase()} number from Lo Shu Grid.`);
        return;
      }
      if (rawDetails[activeTab]) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getPersonalityDestinyDetails(activeTab, activeNumber);
        if (mounted) setRawDetails((current) => ({ ...current, [activeTab]: response }));
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, `Unable to load ${activeTab.toLowerCase()} details`));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [activeNumber, activeTab, rawDetails]);

  const rawCurrentDetails = rawDetails[activeTab];
  const translatedCurrentDetails = translatedDetails[activeTab]?.[language];
  const currentDetails = language === "en" ? rawCurrentDetails : translatedCurrentDetails;

  useEffect(() => {
    let mounted = true;

    async function translateDetails() {
      if (language === "en" || !rawCurrentDetails || translatedCurrentDetails) {
        setTranslating(false);
        return;
      }

      try {
        setTranslating(true);
        const nextDetails = await translatePersonalityDestinyDetails(rawCurrentDetails, language);
        if (!mounted) return;
        setTranslatedDetails((current) => ({
          ...current,
          [activeTab]: {
            ...current[activeTab],
            [language]: nextDetails
          }
        }));
      } finally {
        if (mounted) setTranslating(false);
      }
    }

    translateDetails();
    return () => {
      mounted = false;
    };
  }, [activeTab, language, rawCurrentDetails, translatedCurrentDetails]);

  return {
    currentDetails,
    detailsLoading: loading || translating,
    error,
    retry: () => setRawDetails((current) => ({ ...current, [activeTab]: undefined })),
    translating
  };
}
