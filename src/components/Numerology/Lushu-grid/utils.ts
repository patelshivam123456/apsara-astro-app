import { type LanguageCode } from "@/context/LanguageContext";
import { translateUniqueTexts } from "@/services/translation.service";
import {
  LoShuRepetitionCountsPayload,
  NumberRelationshipItem,
  PersonalityDestinyDetailsResponse,
  PersonalYearMatrixItem,
  SectorWiseEffectsResponse
} from "@/services/numerology.service";

import { detailSectionOrder, detailSections, localizedDigits, sectorEffectTabs } from "./constants";

export function findRelationship(relationships: NumberRelationshipItem[], number?: number) {
  return relationships.find((item) => Number(item.planetNumber) === Number(number));
}

export function getRelationStatus(relationships: NumberRelationshipItem[], personalityNo?: number, destinyNo?: number) {
  const personalityRelationship = findRelationship(relationships, personalityNo);
  const destinyValue = String(destinyNo);

  if (!personalityRelationship || !Number.isFinite(Number(destinyNo))) return "Unknown";
  if (numberListIncludes(personalityRelationship.friendNumbers, destinyValue)) return "Friend";
  if (numberListIncludes(personalityRelationship.enemyNumbers, destinyValue)) return "Enemy";
  if (numberListIncludes(personalityRelationship.neutralNumbers, destinyValue)) return "Neutral";

  return "Unknown";
}

function numberListIncludes(value: string | undefined, target: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .includes(target);
}

export function localizeDigitsInText(value: string | number, language: LanguageCode) {
  const digits = localizedDigits[language] || localizedDigits.en;
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)] || digit);
}

export function buildLoShuCountsPayload(counts?: Record<string, number>) {
  if (!counts) return null;

  return Array.from({ length: 9 }, (_, index) => String(index + 1)).reduce((payload, numberKey) => {
    payload[numberKey as keyof LoShuRepetitionCountsPayload] = Number(counts[numberKey] || 0);
    return payload;
  }, {} as LoShuRepetitionCountsPayload);
}

export function getMonthValue(row: PersonalYearMatrixItem, shortMonth: string, fullMonth: string) {
  const directKeys = [
    shortMonth,
    shortMonth.toLowerCase(),
    shortMonth.toUpperCase(),
    fullMonth,
    fullMonth.toLowerCase(),
    fullMonth.toUpperCase()
  ];

  for (const key of directKeys) {
    const value = row[key];
    if (typeof value === "string" || typeof value === "number") return value;
  }

  const monthItem = row.months?.find((item) => {
    const apiMonth = item.month?.toLowerCase();
    return apiMonth === shortMonth.toLowerCase() || apiMonth === fullMonth.toLowerCase();
  });
  if (monthItem?.personalMonth !== undefined) return monthItem.personalMonth;

  const monthSources = [row.personalMonths, row.month, row.personalMonth].filter(
    (value): value is Record<string, string | number> => Boolean(value) && typeof value === "object"
  );

  for (const source of monthSources) {
    for (const key of directKeys) {
      const value = source[key];
      if (typeof value === "string" || typeof value === "number") return value;
    }
  }

  return "-";
}

export function getPersonalityDestinySections(details: PersonalityDestinyDetailsResponse) {
  const orderedKeys = [
    ...detailSectionOrder,
    ...Object.keys(details).filter((key) => !detailSectionOrder.includes(key))
  ];

  return orderedKeys
    .map((key) => {
      const configuredSection = detailSections.find(([sectionKey]) => sectionKey === key);
      const items = Array.isArray(details[key])
        ? details[key].filter((item) => Boolean(item?.value?.trim()))
        : [];

      return {
        key,
        title: configuredSection?.[1] || titleizeDetailKey(key),
        items
      };
    })
    .filter((section) => section.items.length);
}

export async function translatePersonalityDestinyDetails(details: PersonalityDestinyDetailsResponse, language: LanguageCode) {
  const stringsToTranslate = Object.values(details)
    .flatMap((items) => items || [])
    .flatMap((item) => [item.value, item.lord, item.colour])
    .filter((value): value is string => Boolean(value?.trim()));
  const translations = await translateUniqueTexts(stringsToTranslate, language);
  const translatedEntries = Object.entries(details).map(([key, items]) => [
    key,
    items?.map((item) => ({
      ...item,
      value: item.value ? translations.get(item.value) || item.value : item.value,
      lord: item.lord ? translations.get(item.lord) || item.lord : item.lord,
      colour: item.colour ? translations.get(item.colour) || item.colour : item.colour
    }))
  ]);

  return Object.fromEntries(translatedEntries) as PersonalityDestinyDetailsResponse;
}

export async function translateSectorWiseEffects(effects: SectorWiseEffectsResponse, language: LanguageCode) {
  const effectKeys = sectorEffectTabs.map((tab) => tab.dataKey);
  const stringsToTranslate = effectKeys
    .map((key) => effects[key])
    .filter((value): value is string => Boolean(value?.trim()));
  const translations = await translateUniqueTexts(stringsToTranslate, language);

  return effectKeys.reduce(
    (nextEffects, key) => ({
      ...nextEffects,
      [key]: effects[key] ? translations.get(effects[key] || "") || effects[key] : effects[key]
    }),
    { ...effects }
  );
}

function titleizeDetailKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
