import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { NumerologyExportButton, NumerologyExportSection } from "@/components/Numerology/NumerologyExport";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  DashaMahadashaItem,
  getDashaCalculation,
  getNumberRelationships,
  getPratyantarDasha,
  getVedicGrid,
  NumberRelationshipItem,
  PratyantarDashaItem,
  VedicGridResponse
} from "@/services/numerology.service";
import { translateUniqueTexts } from "@/services/translation.service";

import { GridIntro, NumberSummaryGrid } from "@/components/Numerology/Lushu-grid/Common";
import { DashaChart } from "@/components/Numerology/Vedic-grid/DashaChart";
import { LoShuGrid } from "@/components/Numerology/Lushu-grid/LoShuGrid";
import { PratyantarDashaChart } from "@/components/Numerology/Vedic-grid/PratyantarDashaChart";
import { RelationTable } from "@/components/Numerology/Lushu-grid/RelationTable";
import { styles } from "@/components/Numerology/Lushu-grid/styles";
import { findRelationship, getRelationStatus, localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";

export function VedicGridScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{
    fullName?: string;
    dob?: string;
    gender?: string;
    personBFullName?: string;
    personBDob?: string;
    personBGender?: string;
  }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const personBFullName = String(params.personBFullName || "");
  const personBDob = String(params.personBDob || "");
  const personBGender = String(params.personBGender || "Female");
  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);
  const [vedicGrid, setVedicGrid] = useState<VedicGridResponse | null>(null);
  const [relationships, setRelationships] = useState<NumberRelationshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVedicGrid() {
      try {
        setLoading(true);
        setError(null);
        const response = await getVedicGrid(payload);
        if (!mounted) return;
        setVedicGrid(response);
        const personalityNo = Number(response.driverNumber);
        const destinyNo = Number(response.destinyNumber);
        const relationshipRows = Number.isFinite(personalityNo) && Number.isFinite(destinyNo)
          ? await getNumberRelationships(personalityNo, destinyNo)
          : [];
        if (mounted) setRelationships(relationshipRows);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load vedic grid"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadVedicGrid();
    return () => {
      mounted = false;
    };
  }, [payload]);

  if (loading) return <LoadingState label="Loading vedic grid" />;
  if (error && !vedicGrid) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={[styles.safe, vedicStyles.screenBackground]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView
        style={[styles.scroll, vedicStyles.screenBackground]}
        contentContainerStyle={[styles.resultContent, vedicStyles.contentBackground]}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        <NumerologyCalculationTabs
          active="vedic-grid"
          fullName={fullName}
          dob={dob}
          gender={gender}
          personBFullName={personBFullName}
          personBDob={personBDob}
          personBGender={personBGender}
        />
        <NumerologyExportButton
          title={`${t("Master Vedic Grid")} - ${fullName}`}
          fileName={`vedic-grid-${fullName}`}
          sections={() => buildVedicExportSections({ dob, fullName, gender, language, relationships, t, vedicGrid })}
        />
        <GridIntro
          title={t("Master Vedic Grid")}
          description={t("Vedic number placement showing core numbers, zodiac influence, and active grid energy.")}
        />
        <LoShuGrid grid={vedicGrid?.grid} />
        <NumberSummaryGrid
          rows={[
            [
              { label: t("Personality Number"), value: vedicGrid?.driverNumber, note: t("Inner Nature") },
              { label: t("Destiny Number"), value: vedicGrid?.destinyNumber, note: t("Life Path") },
              { label: t("Kua Number"), value: vedicGrid?.kuaNumber, note: t("Personal Energy") }
            ],
            [
              { label: t("Name Number"), value: vedicGrid?.nameNumber, note: t("Compound") },
              { label: t("Running Age"), value: vedicGrid?.runningAge, note: t("Years") },
              { label: t("Zodiac"), value: vedicGrid?.zodiacNumber, note: vedicGrid?.zodiacSign || t("Zodiac Sign") }
            ]
          ]}
        />
        <RelationTable relationships={relationships} personalityNo={vedicGrid?.driverNumber} destinyNo={vedicGrid?.destinyNumber} />
        <DashaChart dateOfBirth={vedicGrid?.dob || dob} />
        <PratyantarDashaChart dateOfBirth={vedicGrid?.dob || dob} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

const vedicStyles = StyleSheet.create({
  screenBackground: { backgroundColor: "#ffffc9" },
  contentBackground: { backgroundColor: "#ffffc9" }
});

async function buildVedicExportSections({
  dob,
  fullName,
  gender,
  language,
  relationships,
  t,
  vedicGrid
}: {
  dob: string;
  fullName: string;
  gender: string;
  language: ReturnType<typeof useTranslation>["language"];
  relationships: NumberRelationshipItem[];
  t: ReturnType<typeof useTranslation>["t"];
  vedicGrid: VedicGridResponse | null;
}): Promise<NumerologyExportSection[]> {
  const reportDob = vedicGrid?.dob || dob;
  const personalityNumber = Number(vedicGrid?.driverNumber);
  const destinyNumber = Number(vedicGrid?.destinyNumber);
  const relationStatus = getRelationStatus(relationships, personalityNumber, destinyNumber);
  const relationRows = [
    { label: "Personality", number: personalityNumber, relationship: findRelationship(relationships, personalityNumber) },
    { label: "Destiny", number: destinyNumber, relationship: findRelationship(relationships, destinyNumber) }
  ];
  const [dashaRows, pratyantarRows] = await Promise.all([
    fetchDashaExportRows(reportDob),
    fetchPratyantarExportRows(reportDob)
  ]);
  const translationMap = await translateUniqueTexts([
    "Master Vedic Grid",
    "Vedic number placement showing core numbers, zodiac influence, and active grid energy.",
    "Person Details",
    "Full Name",
    "Date of Birth",
    "Gender",
    "Male",
    "Female",
    "Other",
    "Top Row",
    "Middle Row",
    "Bottom Row",
    "Numbers",
    "Personality Number",
    "Destiny Number",
    "Kua Number",
    "Name Number",
    "Running Age",
    "Zodiac",
    "Zodiac Sign",
    "Inner Nature",
    "Life Path",
    "Personal Energy",
    "Compound",
    "Years",
    "Relationships",
    "Number",
    "Friend",
    "Enemy",
    "Neutral",
    "Personality",
    "Destiny",
    "Relation in Personality & Destiny Number",
    "Unknown",
    "Mahadasha & Antardasha Chart",
    "From",
    "To",
    "Maha Dasha",
    "Antar Dasha",
    "Pratyantar Dasha Chart",
    "Pratyantar Dasha",
    relationStatus,
    ...(vedicGrid?.zodiacSign ? [vedicGrid.zodiacSign] : [])
  ], language);
  const tx = (text: string) => translationMap.get(text) || t(text);

  return [
    {
      title: tx("Master Vedic Grid"),
      variant: "intro",
      rows: [[tx("Vedic number placement showing core numbers, zodiac influence, and active grid energy.")]]
    },
    {
      title: tx("Person Details"),
      rows: [
        [tx("Full Name"), tx("Date of Birth"), tx("Gender")],
        [fullName, localizeDigitsInText(dob, language), tx(gender)]
      ]
    },
    {
      title: tx("Master Vedic Grid"),
      variant: "loShuGrid",
      rows: [
        [tx("Top Row"), ...(vedicGrid?.grid?.topRow || []).map((value) => localizeDigitsInText(value, language))],
        [tx("Middle Row"), ...(vedicGrid?.grid?.middleRow || []).map((value) => localizeDigitsInText(value, language))],
        [tx("Bottom Row"), ...(vedicGrid?.grid?.bottomRow || []).map((value) => localizeDigitsInText(value, language))]
      ]
    },
    {
      title: tx("Numbers"),
      variant: "summary",
      rows: [
        [tx("Personality Number"), localizeDigitsInText(vedicGrid?.driverNumber ?? "-", language), tx("Inner Nature")],
        [tx("Destiny Number"), localizeDigitsInText(vedicGrid?.destinyNumber ?? "-", language), tx("Life Path")],
        [tx("Kua Number"), localizeDigitsInText(vedicGrid?.kuaNumber ?? "-", language), tx("Personal Energy")],
        [tx("Name Number"), localizeDigitsInText(vedicGrid?.nameNumber ?? "-", language), tx("Compound")],
        [tx("Running Age"), localizeDigitsInText(vedicGrid?.runningAge ?? "-", language), tx("Years")],
        [tx("Zodiac"), localizeDigitsInText(vedicGrid?.zodiacNumber ?? "-", language), vedicGrid?.zodiacSign ? tx(vedicGrid.zodiacSign) : tx("Zodiac Sign")]
      ]
    },
    {
      title: tx("Relationships"),
      rows: [
        [tx("Number"), tx("Friend"), tx("Enemy"), tx("Neutral")],
        ...relationRows.map(({ label, number, relationship }) => [
          `${tx(label)} ${localizeDigitsInText(Number.isFinite(number) ? number : "-", language)}`,
          localizeDigitsInText(relationship?.friendNumbers || "-", language),
          localizeDigitsInText(relationship?.enemyNumbers || "-", language),
          localizeDigitsInText(relationship?.neutralNumbers || "-", language)
        ]),
        [
          tx("Relation in Personality & Destiny Number"),
          `${localizeDigitsInText(`${vedicGrid?.driverNumber ?? "-"}:${vedicGrid?.destinyNumber ?? "-"}`, language)} = ${tx(relationStatus)}`,
          "",
          ""
        ]
      ]
    },
    {
      title: tx("Mahadasha & Antardasha Chart"),
      rows: [
        [tx("From"), tx("To"), tx("Maha Dasha"), tx("Antar Dasha")],
        ...dashaRows.map((row) => [
          localizeDigitsInText(compactDate(row.fromDate), language),
          localizeDigitsInText(compactDate(row.toDate), language),
          localizeDigitsInText(row.mahadashaNumber ?? "-", language),
          localizeDigitsInText(row.antardashaNumber ?? "-", language)
        ])
      ]
    },
    {
      title: tx("Pratyantar Dasha Chart"),
      rows: [
        [tx("From"), tx("To"), tx("Pratyantar Dasha")],
        ...pratyantarRows.map((row) => [
          localizeDigitsInText(compactDate(row.fromDate, true), language),
          localizeDigitsInText(compactDate(row.toDate, true), language),
          localizeDigitsInText(row.pratyantarDashaNumber ?? "-", language)
        ])
      ]
    }
  ];
}

type DashaExportRow = {
  fromDate: string;
  toDate: string;
  mahadashaNumber?: number;
  antardashaNumber?: number;
  startTimestamp: number;
  endTimestamp: number;
};

type PratyantarExportRow = {
  fromDate: string;
  toDate: string;
  pratyantarDashaNumber?: number;
  startTimestamp: number;
};

const maxDashaToDate = new Date(2060, 11, 31);
const pratyantarDefaultYears = 10;
const pratyantarInitialFromDate = new Date(2021, 0, 1);

async function fetchDashaExportRows(dateOfBirth?: string) {
  const dobDate = normalizeDate(dateOfBirth);
  if (!dobDate) return [];
  const response = await getDashaCalculation(formatDisplayDate(dobDate), formatDisplayDate(dobDate), formatDisplayDate(maxDashaToDate));
  return flattenDashaRows(response.mahadashas || [], dobDate, maxDashaToDate);
}

async function fetchPratyantarExportRows(dateOfBirth?: string) {
  const dobDate = normalizeDate(dateOfBirth);
  if (!dobDate) return [];
  const fromDate = compareDates(pratyantarInitialFromDate, dobDate) < 0 ? dobDate : pratyantarInitialFromDate;
  const response = await getPratyantarDasha(formatDisplayDate(dobDate), formatDisplayDate(fromDate), pratyantarDefaultYears);
  return mergePratyantarRows(
    response
      .map(mapPratyantarRow)
      .filter((row) => row.fromDate || row.toDate)
      .filter((row) => Number.isFinite(row.startTimestamp) && row.startTimestamp >= dobDate.getTime())
  );
}

function flattenDashaRows(mahadashas: DashaMahadashaItem[] = [], selectedFromDate: Date, selectedToDate: Date) {
  const rows = mahadashas.flatMap((mahadasha, mahaIndex) =>
    (mahadasha.antardashas || []).map((antardasha, antarIndex) => {
      const fromDate = normalizeApiDate(antardasha.startDate);
      const toDate = normalizeApiDate(antardasha.endDate);
      const startDate = parseDisplayDate(fromDate);
      const endDate = parseDisplayDate(toDate);
      return {
        fromDate,
        toDate,
        mahadashaNumber: antardasha.mahadashaNumber ?? mahadasha.mahadashaNumber,
        antardashaNumber: antardasha.antardashaNumber,
        startTimestamp: startDate?.getTime() ?? NaN,
        endTimestamp: endDate?.getTime() ?? NaN,
        id: `${mahaIndex}-${antarIndex}-${fromDate}-${toDate}`
      };
    })
  );

  const unique = new Map<string, DashaExportRow>();
  rows
    .filter((row) => Number.isFinite(row.startTimestamp) && Number.isFinite(row.endTimestamp))
    .filter((row) => row.startTimestamp <= selectedToDate.getTime() && row.endTimestamp >= selectedFromDate.getTime())
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .forEach((row) => {
      const key = `${row.fromDate}-${row.toDate}-${row.mahadashaNumber}-${row.antardashaNumber}`;
      if (!unique.has(key)) unique.set(key, row);
    });

  return Array.from(unique.values());
}

function mapPratyantarRow(item: PratyantarDashaItem, index: number): PratyantarExportRow {
  const fromDate = normalizeApiDate(item.effectiveStartDate || item.birthdayDate);
  const toDate = normalizeApiDate(item.effectiveEndDate || item.birthdayDate);
  const startDate = parseDisplayDate(fromDate);
  return {
    fromDate,
    toDate,
    pratyantarDashaNumber: item.pratyantarDashaNumber,
    startTimestamp: startDate?.getTime() ?? NaN
  };
}

function mergePratyantarRows(nextRows: PratyantarExportRow[]) {
  const unique = new Map<string, PratyantarExportRow>();
  nextRows
    .sort((a, b) => a.startTimestamp - b.startTimestamp)
    .forEach((row) => {
      const key = `${row.fromDate}-${row.toDate}-${row.pratyantarDashaNumber ?? "-"}`;
      if (!unique.has(key)) unique.set(key, row);
    });

  return Array.from(unique.values());
}

function normalizeDate(value?: string) {
  const display = parseDisplayDate(value);
  if (display) return display;
  const isoMatch = value?.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!isoMatch) return null;
  const [, year, month, day] = isoMatch;
  return parseDisplayDate(`${day}-${month}-${year}`);
}

function normalizeApiDate(value?: string) {
  const parsed = normalizeDate(value);
  return parsed ? formatDisplayDate(parsed) : value || "";
}

function parseDisplayDate(value?: string) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
  return stripTime(date);
}

function formatDisplayDate(date: Date) {
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

function compactDate(value: string, shortYear = false) {
  const parsed = parseDisplayDate(value);
  if (!parsed) return value;
  const year = shortYear ? String(parsed.getFullYear()).slice(-2) : String(parsed.getFullYear());
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${year}`;
}

function compareDates(a: Date, b: Date) {
  return stripTime(a).getTime() - stripTime(b).getTime();
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
