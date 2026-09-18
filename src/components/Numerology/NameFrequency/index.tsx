import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { NumerologyExportButton, NumerologyExportSection } from "@/components/Numerology/NumerologyExport";
import { GridIntro } from "@/components/Numerology/Lushu-grid/Common";
import { localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  ChaldeanNameLetterAnalysisChartResponse,
  ChaldeanNamePairEventsResponse,
  getChaldeanNameLetterAnalysisChart,
  getChaldeanNamePairEvents,
  getNameFrequencyNameChart,
  getNumberRelationships,
  getPythagoreanRunningAgeAlphabet,
  NameFrequencyNameChartResponse,
  NumerologyPredictionItem,
  NumberRelationshipItem,
  PythagoreanRunningAgeAlphabetItem
} from "@/services/numerology.service";
import { translateUniqueTexts } from "@/services/translation.service";

const EMPTY_NAME_LETTERS: NonNullable<ChaldeanNameLetterAnalysisChartResponse["nameLetters"]> = [];
const EMPTY_NUMBER_FREQUENCY: NonNullable<ChaldeanNameLetterAnalysisChartResponse["numberFrequency"]> = [];
const FREQUENCY_LABELS = ["Once", "Twice", "Thrice", "Four", "Five", "Six", "Seven", "Eight", "Ninth"];

export function NameFrequencyScreen() {
  const { language, t } = useTranslation();
  const params = useLocalSearchParams<{
    fullName?: string;
    dob?: string;
    gender?: string;
    mobileNumber?: string;
    personBFullName?: string;
    personBDob?: string;
    personBGender?: string;
  }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const mobileNumber = String(params.mobileNumber || "");
  const personBFullName = String(params.personBFullName || "");
  const personBDob = String(params.personBDob || "");
  const personBGender = String(params.personBGender || "Female");
  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);
  const [nameChart, setNameChart] = useState<NameFrequencyNameChartResponse | null>(null);
  const [pairEvents, setPairEvents] = useState<ChaldeanNamePairEventsResponse | null>(null);
  const [letterAnalysis, setLetterAnalysis] = useState<ChaldeanNameLetterAnalysisChartResponse | null>(null);
  const [runningAgeAlphabet, setRunningAgeAlphabet] = useState<PythagoreanRunningAgeAlphabetItem[]>([]);
  const [nameLetterRelationships, setNameLetterRelationships] = useState<NumberRelationshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNameFrequency() {
      try {
        setLoading(true);
        setError(null);
        const nameChartResponse = await getNameFrequencyNameChart(payload);
        if (!mounted) return;
        setNameChart(nameChartResponse);
        const relationshipRows = await loadNameLetterRelationships(nameChartResponse);
        if (!mounted) return;
        setNameLetterRelationships(relationshipRows);

        const pairEventResponse = await getChaldeanNamePairEvents(fullName);
        if (!mounted) return;
        setPairEvents(pairEventResponse);

        const letterAnalysisResponse = await getChaldeanNameLetterAnalysisChart(fullName);
        if (mounted) setLetterAnalysis(letterAnalysisResponse);

        if (!dob) {
          if (mounted) setRunningAgeAlphabet([]);
          return;
        }

        const runningAgeAlphabetResponse = await getPythagoreanRunningAgeAlphabet(payload);
        if (mounted) setRunningAgeAlphabet(runningAgeAlphabetResponse);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load name frequency"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadNameFrequency();
    return () => {
      mounted = false;
    };
  }, [dob, fullName, payload]);

  const summaryRows = useMemo(
    () => [
      [
        { label: t("Total Letters"), value: letterAnalysis?.totalLetters },
        { label: t("Compound Name Number"), value: letterAnalysis?.compoundNameNumber },
        { label: t("Total Name Number"), value: letterAnalysis?.totalNameNumber }
      ],
      [
        { label: t("Total Life Years"), value: pairEvents?.totalLifeYears },
        { label: t("First Name"), value: letterAnalysis?.firstName || "-" },
        { label: t("Last Name"), value: letterAnalysis?.lastName || "-" }
      ]
    ],
    [letterAnalysis, pairEvents, t]
  );

  if (loading) return <LoadingState label="Loading name frequency" />;
  if (error && !nameChart && !pairEvents) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <NumerologyCalculationTabs
          active="name-frequency"
          fullName={fullName}
          dob={dob}
          gender={gender}
          mobileNumber={mobileNumber}
          personBFullName={personBFullName}
          personBDob={personBDob}
          personBGender={personBGender}
        />
        <NumerologyExportButton
          title={`${t("Name Frequency")} - ${fullName}`}
          fileName={`name-frequency-${fullName}`}
          sections={() => buildNameFrequencyExportSections({
            dob,
            fullName,
            gender,
            language,
            letterAnalysis,
            nameChart,
            pairEvents,
            runningAgeAlphabet,
            nameLetterRelationships,
            t
          })}
        />
        <GridIntro
          title={t("Name Frequency")}
          description={t("Chaldean name pair events and letter frequency analysis.")}
        />
        <NameSummary fullName={letterAnalysis?.fullName || pairEvents?.fullName || fullName} normalizedName={letterAnalysis?.normalizedName || pairEvents?.normalizedName} />
        
        <SummaryGrid rows={summaryRows} />
        <PairEventsTable data={pairEvents} />
        <RunningAgeAlphabetTable rows={runningAgeAlphabet} />
        <NameLettersTable data={letterAnalysis} />
        <NumberFrequencyTable data={letterAnalysis} />
        <NameFrequencyPredictionCards name={fullName} data={letterAnalysis} />
        <NameChartTable data={nameChart} relationships={nameLetterRelationships} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function NameChartTable({ data, relationships }: { data: NameFrequencyNameChartResponse | null; relationships: NumberRelationshipItem[] }) {
  const { language, t } = useTranslation();
  const rows = useMemo(
    () => [
      { particular: t("Name Age"), number: data?.nameAge },
      { particular: t("Running Age"), number: data?.runningAge },
      { particular: t("First Name Number"), number: data?.firstNameNumber },
      { particular: t("Name Number"), number: data?.nameNumber },
      { particular: t("Name Number with Personality"), number: data?.nameNumberWithPersonality, relation: data?.nameNumberPersonalityRelation },
      { particular: t("Name Number with Destiny"), number: data?.nameNumberWithDestiny, relation: data?.nameNumberDestinyRelation },
      { particular: t("First Letter with Name Number"), number: data?.firstNameLetterWithNameNumber, relation: data?.firstNameLetterWithNameNumberRelation },
      { particular: t("Second Letter with Name Number"), number: data?.secondNameLetterWithNameNumber, relation: data?.secondNameLetterWithNameNumberRelation },
      { particular: t("First Letter with Zodiac Number"), number: data?.firstNameLetterWithZodicNumber, relation: data?.firstLetterWithZodiacRelation },
      { particular: t("First and Second Letter Relation"), number: data?.firstAndSecondNameLetterNumber, relation: data?.firstAndSecondNameLetterRelation }
    ],
    [data, t]
  );

  return (
    <View style={styles.tablePanel}>
      <Text style={styles.tableTitle}>{t("Name Chart")}</Text>
      <View style={styles.nameChartTable}>
        <NameChartRow cells={[t("Particular"), t("Numbers"), t("Relation")]} header />
        {rows.map((row) => (
          <NameChartRow
            key={row.particular}
            relation={getDisplayRelation(row.number, row.relation, relationships)}
            cells={[
              row.particular,
              localizeDigitsInText(row.number || "-", language),
              getDisplayRelation(row.number, row.relation, relationships)
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function NameSummary({ fullName, normalizedName }: { fullName?: string; normalizedName?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.infoTable}>
      <InfoRow label={t("Full Name")} value={fullName || "-"} />
      <InfoRow label={t("Normalized Name")} value={normalizedName || "-"} last />
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>{value}</Text>
    </View>
  );
}

function SummaryGrid({ rows }: { rows: { label: string; value?: string | number }[][] }) {
  const { language } = useTranslation();
  return (
    <View style={styles.summaryTable}>
      {rows.map((row, rowIndex) => (
        <View key={`summary-${rowIndex}`} style={styles.summaryRow}>
          {row.map((item, itemIndex) => (
            <View key={`${item.label}-${itemIndex}`} style={[styles.summaryCell, itemIndex < row.length - 1 && styles.cellRightBorder]}>
              <Text style={styles.summaryLabel} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.62}>{item.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
                {localizeDigitsInText(item.value ?? "-", language)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PairEventsTable({ data }: { data: ChaldeanNamePairEventsResponse | null }) {
  const { language, t } = useTranslation();
  const rows = data?.events?.length ? data.events : [];

  return (
    <View style={styles.tablePanel}>
      <Text style={styles.tableTitle}>{t("Name Pair Events")}</Text>
      <View style={styles.wideTable}>
        <TableRow
          cells={[t("Year"), t("Pair"), t("Event 1"), t("Event 2"), t("Vibration")]}
          header
        />
        {rows.map((row, index) => (
          <TableRow
            key={`${row.letterPair}-${row.lifeYear}-${index}`}
            cells={[
              localizeDigitsInText(row.lifeYear ?? "-", language),
              row.letterPair || "-",
              localizeDigitsInText(row.eventOne ?? "-", language),
              localizeDigitsInText(row.eventTwo ?? "-", language),
              row.vibration || "-"
            ]}
          />
        ))}
        {!rows.length ? <EmptyTableRow label={t("No records found")} /> : null}
      </View>
    </View>
  );
}

function NumberFrequencyTable({ data }: { data: ChaldeanNameLetterAnalysisChartResponse | null }) {
  const { language, t } = useTranslation();
  const rows = data?.numberFrequency?.length ? data.numberFrequency : EMPTY_NUMBER_FREQUENCY;
  const frequencyRows = useMemo(() => buildNumberFrequencyRows(rows), [rows]);

  return (
    <View style={styles.tablePanel}>
      <Text style={styles.numberFrequencyTitle}>{t("Number Frequencies")}</Text>
      <View style={styles.compactTable}>
        <TableRow cells={[t("Frequency"), t("Numbers")]} header />
        {frequencyRows.map((row) => (
          <TableRow
            key={row.frequency}
            cells={[
              t(row.frequency),
              localizeDigitsInText(row.numbers, language)
            ]}
          />
        ))}
        {!frequencyRows.length ? <EmptyTableRow label={t("No records found")} /> : null}
      </View>
    </View>
  );
}

function NameFrequencyPredictionCards({ data, name }: { data: ChaldeanNameLetterAnalysisChartResponse | null; name: string }) {
  const { language, t } = useTranslation();
  const rows = useMemo(() => getNameFrequencyPredictionItems(data), [data]);
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let mounted = true;

    async function translateRows() {
      const texts = rows.flatMap((row, index) => {
        const title = formatPredictionTitle(row, index);
        const numberLabel = title.toLowerCase().includes("number") ? title : `${title} Number`;
        return ["Properties", title, numberLabel, getPredictionProperties(row)].filter(Boolean);
      });
      const translations = await translateUniqueTexts(texts, language);
      if (mounted) setTranslationMap(translations);
    }

    translateRows();
    return () => {
      mounted = false;
    };
  }, [language, rows]);

  if (!rows.length) return null;
  const tx = (text: string) => translationMap.get(text) || t(text);

  return (
    <>
      {rows.map((row, index) => {
        const title = formatPredictionTitle(row, index);
        const number = getPredictionNumber(row);
        const properties = getPredictionProperties(row);
        const numberLabel = title.toLowerCase().includes("number") ? title : `${title} Number`;

        return (
          <View key={`${title}-${index}`} style={styles.predictionCard}>
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>{t("Name")}</Text>
              <Text style={styles.predictionValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>
                {data?.fullName || name || "-"}
              </Text>
            </View>
            <View style={styles.predictionRow}>
              <Text style={styles.predictionLabel}>{tx(numberLabel)}</Text>
              <Text style={styles.predictionValue}>{localizeDigitsInText(number ?? "-", language)}</Text>
            </View>
            <View style={styles.predictionBodyRow}>
              <Text style={styles.predictionLabel}>{tx("Properties")} :</Text>
              <Text style={styles.predictionBody}>{properties ? tx(properties) : "-"}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

function RunningAgeAlphabetTable({ rows }: { rows: PythagoreanRunningAgeAlphabetItem[] }) {
  const { language, t } = useTranslation();
  const tableRows = rows.length ? rows : [{ letter: "-", periodInYear: undefined, fromYear: undefined, toYear: undefined }];

  return (
    <View style={styles.runningAgePanel}>
      <Text style={styles.runningAgeTitle}>{t("Running Age Alphabet")}</Text>
      <View style={styles.runningAgeHeaderRow}>
        <Text style={styles.runningAgeHeadCell}>{t("Alphabet")}</Text>
        <Text style={styles.runningAgeHeadCell}>{t("Period (in year)")}</Text>
        <Text style={styles.runningAgeHeadCell}>{t("From")}</Text>
        <Text style={styles.runningAgeHeadCell}>{t("To")}</Text>
      </View>
      {tableRows.map((row, index) => (
        <View key={`${row.letter || "-"}-${row.fromYear || index}`} style={styles.runningAgeRow}>
          <Text style={styles.runningAgeCell}>{row.letter || "-"}</Text>
          <Text style={styles.runningAgeCell}>{localizeDigitsInText(row.periodInYear ?? "-", language)}</Text>
          <Text style={styles.runningAgeCell}>{localizeDigitsInText(row.fromYear ?? "-", language)}</Text>
          <Text style={styles.runningAgeCell}>{localizeDigitsInText(row.toYear ?? "-", language)}</Text>
        </View>
      ))}
    </View>
  );
}

function NameLettersTable({ data }: { data: ChaldeanNameLetterAnalysisChartResponse | null }) {
  const { language, t } = useTranslation();
  const rows = data?.nameLetters?.length ? data.nameLetters : EMPTY_NAME_LETTERS;
  const columns = useMemo(() => buildNameLetterChartColumns(rows), [rows]);

  return (
    <View style={styles.tablePanel}>
      <Text style={styles.letterAnalysisTitle}>{t("Name Letter Analysis")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.letterAnalysisTable}>
          {rows.length ? (
            <>
              <LetterAnalysisRow
                label={t("Letter")}
                values={columns.map((column) => column.letter)}
                header
              />
              <LetterAnalysisRow
                label={t("Chaldean Number")}
                values={columns.map((column) => localizeDigitsInText(column.chaldeanNumber ?? "-", language))}
              />
              <LetterAnalysisRow
                label={t("Placement")}
                values={columns.map((column) => localizeDigitsInText(column.positionInFullName ?? "-", language))}
                last
              />
            </>
          ) : (
            <EmptyTableRow label={t("No records found")} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type NameLetterChartColumn = {
  letter: string;
  chaldeanNumber?: number | string;
  positionInFullName?: number | string;
};

function buildNameLetterChartColumns(rows: NonNullable<ChaldeanNameLetterAnalysisChartResponse["nameLetters"]>) {
  const columns: NameLetterChartColumn[] = [];

  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    if (index > 0 && row.namePart && previous?.namePart && row.namePart !== previous.namePart) {
      columns.push({ letter: "-", chaldeanNumber: "-", positionInFullName: "-" });
    }

    columns.push({
      letter: row.nameLetter || "-",
      chaldeanNumber: row.chaldeanNumber ?? "-",
      positionInFullName: row.positionInFullName ?? "-"
    });
  });

  return columns;
}

function buildNumberFrequencyRows(rows: NonNullable<ChaldeanNameLetterAnalysisChartResponse["numberFrequency"]>) {
  return FREQUENCY_LABELS.map((frequency, index) => {
    const count = index + 1;
    const numbers = rows
      .filter((row) => row.count === count && row.number !== undefined)
      .map((row) => String(row.number))
      .join(", ");

    return { frequency, numbers };
  }).filter((row) => row.numbers.length > 0);
}

function getNameFrequencyPredictionItems(data: ChaldeanNameLetterAnalysisChartResponse | null) {
  if (!data) return [];

  const known =
    data.predictions ||
    data.nameNoPredictions ||
    data.nameNumberPredictions ||
    data.chaldeanNameNoPredictions ||
    data.nameLetterAnalysisPredictions;

  if (known) return applyNameFrequencyNumberFallbacks(normalizePredictionItems(known), data);

  const ignored = new Set([
    "fullName",
    "normalizedName",
    "firstName",
    "middleName",
    "lastName",
    "totalLetters",
    "compoundNameNumber",
    "totalNameNumber",
    "numberFrequency",
    "nameLetters",
    "numberFrequencyCount"
  ]);

  return Object.entries(data)
    .filter(([key]) => !ignored.has(key))
    .flatMap(([key, value]) => normalizePredictionItems(value).map((item) => ({ ...item, title: String(getTextValue(item.title) ?? key) })))
    .map((item) => applyNameFrequencyNumberFallback(item, data));
}

function normalizePredictionItems(value: unknown): NumerologyPredictionItem[] {
  if (Array.isArray(value)) return value.flatMap((item) => normalizePredictionItems(item));
  if (!value || typeof value !== "object") return [];

  const record = value as NumerologyPredictionItem;
  if (getPredictionProperties(record) || getPredictionNumber(record) !== undefined) return [record];

  return Object.entries(record).flatMap(([key, nested]) => {
    if (Array.isArray(nested) || (nested && typeof nested === "object")) {
      return normalizePredictionItems(nested).map((item) => ({ ...item, title: String(getTextValue(item.title) ?? key) }));
    }
    return [{ title: key, properties: String(nested ?? "") }];
  });
}

function formatPredictionTitle(item: NumerologyPredictionItem, index: number) {
  return String(getTextValue(item.title) || getTextValue(item.name) || getTextValue(item.type) || getTextValue(item.label) || `Prediction ${index + 1}`)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}

function getPredictionNumber(item: NumerologyPredictionItem) {
  const record = item as Record<string, unknown>;
  return (
    getTextValue(
      item.number ??
        item.value ??
        record.predictionNumber ??
        record.numberValue ??
        record.numberNo ??
        record.no ??
        record.compoundNameNumber ??
        record.compoundNameNo ??
        record.nameNumber ??
        record.nameNo ??
        record.totalNameNumber ??
        record.totalNameNo ??
        record.expressionNumber ??
        record.expressionNo ??
        record.soulNumber ??
        record.soulNo
    ) ?? getTrailingNumber(item.title ?? item.name ?? item.type ?? item.label)
  );
}

function getPredictionProperties(item: NumerologyPredictionItem) {
  return String(item.properties ?? item.prediction ?? item.description ?? item.meaning ?? item.impact ?? item.probableImpact ?? item.text ?? "").trim();
}

function getTextValue(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function applyNameFrequencyNumberFallbacks(items: NumerologyPredictionItem[], data: ChaldeanNameLetterAnalysisChartResponse) {
  return items.map((item) => applyNameFrequencyNumberFallback(item, data));
}

function applyNameFrequencyNumberFallback(item: NumerologyPredictionItem, data: ChaldeanNameLetterAnalysisChartResponse) {
  if (getPredictionNumber(item) !== undefined) return item;

  const title = formatPredictionTitle(item, 0).toLowerCase();
  if (title.includes("compound")) return { ...item, number: data.compoundNameNumber };
  if (title.includes("total")) return { ...item, number: data.totalNameNumber };
  if (title.includes("name")) return { ...item, number: data.totalNameNumber ?? data.compoundNameNumber };
  return item;
}

function getTrailingNumber(value: unknown): string | undefined {
  return String(value || "").match(/\d+/g)?.at(-1);
}

function buildNameFrequencyExportSections({
  dob,
  fullName,
  gender,
  language,
  letterAnalysis,
  nameChart,
  nameLetterRelationships,
  pairEvents,
  runningAgeAlphabet,
  t
}: {
  dob: string;
  fullName: string;
  gender: string;
  language: ReturnType<typeof useTranslation>["language"];
  letterAnalysis: ChaldeanNameLetterAnalysisChartResponse | null;
  nameChart: NameFrequencyNameChartResponse | null;
  nameLetterRelationships: NumberRelationshipItem[];
  pairEvents: ChaldeanNamePairEventsResponse | null;
  runningAgeAlphabet: PythagoreanRunningAgeAlphabetItem[];
  t: ReturnType<typeof useTranslation>["t"];
}): Promise<NumerologyExportSection[]> {
  const frequencyRows = buildNumberFrequencyRows(letterAnalysis?.numberFrequency || EMPTY_NUMBER_FREQUENCY);
  const nameLetterColumns = buildNameLetterChartColumns(letterAnalysis?.nameLetters || EMPTY_NAME_LETTERS);
  const predictionRows = getNameFrequencyPredictionItems(letterAnalysis);
  return translateUniqueTexts([
    "Name Frequency",
    "Chaldean name pair events and letter frequency analysis.",
    "Person Details",
    "Full Name",
    "Date of Birth",
    "Gender",
    "Male",
    "Female",
    "Other",
    "Name Summary",
    "Normalized Name",
    "Total Letters",
    "Compound Name Number",
    "Total Name Number",
    "Total Life Years",
    "First Name",
    "Last Name",
    "Name Pair Events",
    "Year",
    "Pair",
    "Event 1",
    "Event 2",
    "Vibration",
    "No records found",
    "Running Age Alphabet",
    "Alphabet",
    "Period (in year)",
    "From",
    "To",
    "Name Letter Analysis",
    "Letter",
    "Chaldean Number",
    "Placement",
    "Number Frequencies",
    "Frequency",
    "Numbers",
    "Name Chart",
    "Particular",
    "Relation",
    "Properties",
    "Name Age",
    "Running Age",
    "First Name Number",
    "Name Number",
    "Name Number with Personality",
    "Name Number with Destiny",
    "First Letter with Name Number",
    "Second Letter with Name Number",
    "First Letter with Zodiac Number",
    "First and Second Letter Relation",
    ...FREQUENCY_LABELS,
    ...predictionRows.flatMap((row, index) => {
      const title = formatPredictionTitle(row, index);
      const numberLabel = title.toLowerCase().includes("number") ? title : `${title} Number`;
      return [title, numberLabel, getPredictionProperties(row)].filter(Boolean);
    }),
    ...(pairEvents?.events || []).flatMap((row) => [row.vibration].filter((value): value is string => Boolean(value?.trim()))),
    ...[
      nameChart?.nameNumberPersonalityRelation,
      nameChart?.nameNumberDestinyRelation,
      nameChart?.firstNameLetterWithNameNumberRelation,
      nameChart?.secondNameLetterWithNameNumberRelation,
      nameChart?.firstLetterWithZodiacRelation,
      nameChart?.firstAndSecondNameLetterRelation
    ].filter((value): value is string => Boolean(value?.trim()))
  ], language).then((translationMap) => {
    const tx = (text: string) => translationMap.get(text) || t(text);

    return [
    {
      title: tx("Name Frequency"),
      variant: "intro",
      rows: [[tx("Chaldean name pair events and letter frequency analysis.")]]
    },
    {
      title: tx("Person Details"),
      rows: [
        [tx("Full Name"), tx("Date of Birth"), tx("Gender")],
        [fullName, localizeDigitsInText(dob, language), tx(gender)]
      ]
    },
    {
      title: tx("Name Summary"),
      variant: "soul",
      rows: [
        [tx("Full Name"), letterAnalysis?.fullName || pairEvents?.fullName || fullName],
        [tx("Normalized Name"), letterAnalysis?.normalizedName || pairEvents?.normalizedName || "-"]
      ]
    },
    {
      title: tx("Name Summary"),
      variant: "summary",
      rows: [
        [tx("Total Letters"), localizeDigitsInText(letterAnalysis?.totalLetters ?? "-", language), ""],
        [tx("Compound Name Number"), localizeDigitsInText(letterAnalysis?.compoundNameNumber ?? "-", language), ""],
        [tx("Total Name Number"), localizeDigitsInText(letterAnalysis?.totalNameNumber ?? "-", language), ""],
        [tx("Total Life Years"), localizeDigitsInText(pairEvents?.totalLifeYears ?? "-", language), ""],
        [tx("First Name"), letterAnalysis?.firstName || "-", ""],
        [tx("Last Name"), letterAnalysis?.lastName || "-", ""]
      ]
    },
    {
      title: tx("Name Pair Events"),
      layout: "wide",
      rows: [
        [tx("Year"), tx("Pair"), tx("Event 1"), tx("Event 2"), tx("Vibration")],
        ...(pairEvents?.events || []).map((row) => [
          localizeDigitsInText(row.lifeYear ?? "-", language),
          row.letterPair,
          localizeDigitsInText(row.eventOne ?? "-", language),
          localizeDigitsInText(row.eventTwo ?? "-", language),
          row.vibration ? tx(row.vibration) : "-"
        ]),
        ...(!(pairEvents?.events || []).length ? [[tx("No records found"), "", "", "", ""]] : [])
      ]
    },
    {
      title: tx("Running Age Alphabet"),
      rows: [
        [tx("Alphabet"), tx("Period (in year)"), tx("From"), tx("To")],
        ...(runningAgeAlphabet.length ? runningAgeAlphabet : [{ letter: "-", periodInYear: undefined, fromYear: undefined, toYear: undefined }]).map((row) => [
          row.letter,
          localizeDigitsInText(row.periodInYear ?? "-", language),
          localizeDigitsInText(row.fromYear ?? "-", language),
          localizeDigitsInText(row.toYear ?? "-", language)
        ])
      ]
    },
    {
      title: tx("Name Letter Analysis"),
      layout: "wide",
      rows: [
        [tx("Letter"), ...nameLetterColumns.map((column) => column.letter)],
        [tx("Chaldean Number"), ...nameLetterColumns.map((column) => localizeDigitsInText(column.chaldeanNumber ?? "-", language))],
        [tx("Placement"), ...nameLetterColumns.map((column) => localizeDigitsInText(column.positionInFullName ?? "-", language))],
        ...(!nameLetterColumns.length ? [[tx("No records found")]] : [])
      ]
    },
    {
      title: tx("Number Frequencies"),
      rows: [
        [tx("Frequency"), tx("Numbers")],
        ...frequencyRows.map((row) => [tx(row.frequency), localizeDigitsInText(row.numbers, language)]),
        ...(!frequencyRows.length ? [[tx("No records found"), ""]] : [])
      ]
    },
    ...predictionRows.map((row, index) => {
      const title = formatPredictionTitle(row, index);
      const number = getPredictionNumber(row);
      const numberLabel = title.toLowerCase().includes("number") ? title : `${title} Number`;
      return {
        title: tx(title),
        variant: "soul" as const,
        rows: [
          [tx("Name"), letterAnalysis?.fullName || fullName],
          [tx(numberLabel), localizeDigitsInText(number ?? "-", language)],
          [tx("Properties"), tx(getPredictionProperties(row) || "-")]
        ]
      };
    }),
    {
      title: tx("Name Chart"),
      rows: [
        [tx("Particular"), tx("Numbers"), tx("Relation")],
        [tx("Name Age"), localizeDigitsInText(nameChart?.nameAge || "-", language), "-"],
        [tx("Running Age"), localizeDigitsInText(nameChart?.runningAge || "-", language), "-"],
        [tx("First Name Number"), localizeDigitsInText(nameChart?.firstNameNumber || "-", language), "-"],
        [tx("Name Number"), localizeDigitsInText(nameChart?.nameNumber || "-", language), "-"],
        [tx("Name Number with Personality"), localizeDigitsInText(nameChart?.nameNumberWithPersonality || "-", language), txRelation(getDisplayRelation(nameChart?.nameNumberWithPersonality, nameChart?.nameNumberPersonalityRelation, nameLetterRelationships), tx)],
        [tx("Name Number with Destiny"), localizeDigitsInText(nameChart?.nameNumberWithDestiny || "-", language), txRelation(getDisplayRelation(nameChart?.nameNumberWithDestiny, nameChart?.nameNumberDestinyRelation, nameLetterRelationships), tx)],
        [tx("First Letter with Name Number"), localizeDigitsInText(nameChart?.firstNameLetterWithNameNumber || "-", language), txRelation(getDisplayRelation(nameChart?.firstNameLetterWithNameNumber, nameChart?.firstNameLetterWithNameNumberRelation, nameLetterRelationships), tx)],
        [tx("Second Letter with Name Number"), localizeDigitsInText(nameChart?.secondNameLetterWithNameNumber || "-", language), txRelation(getDisplayRelation(nameChart?.secondNameLetterWithNameNumber, nameChart?.secondNameLetterWithNameNumberRelation, nameLetterRelationships), tx)],
        [tx("First Letter with Zodiac Number"), localizeDigitsInText(nameChart?.firstNameLetterWithZodicNumber || "-", language), txRelation(getDisplayRelation(nameChart?.firstNameLetterWithZodicNumber, nameChart?.firstLetterWithZodiacRelation, nameLetterRelationships), tx)],
        [tx("First and Second Letter Relation"), localizeDigitsInText(nameChart?.firstAndSecondNameLetterNumber || "-", language), txRelation(getDisplayRelation(nameChart?.firstAndSecondNameLetterNumber, nameChart?.firstAndSecondNameLetterRelation, nameLetterRelationships), tx)]
      ]
    }
  ];
  });
}

function LetterAnalysisRow({ label, values, header = false, last = false }: { label: string; values: (string | number)[]; header?: boolean; last?: boolean }) {
  return (
    <View style={[styles.letterAnalysisRow, last && styles.lastRow]}>
      <Text style={[styles.letterAnalysisLabel, header && styles.letterAnalysisLabelHeader]}>{label}</Text>
      {values.map((value, index) => (
        <Text
          key={`${label}-${value}-${index}`}
          style={[styles.letterAnalysisCell, header && styles.letterAnalysisHeadCell, index === values.length - 1 && styles.lastCell]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </Text>
      ))}
    </View>
  );
}

function TableRow({ cells, header = false }: { cells: (string | number)[]; header?: boolean }) {
  return (
    <View style={styles.tableRow}>
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[styles.tableCell, header && styles.tableHeadCell, index === cells.length - 1 && styles.lastCell]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.62}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

function EmptyTableRow({ label }: { label: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.emptyCell, styles.lastCell]}>{label}</Text>
    </View>
  );
}

function NameChartRow({ cells, header = false, relation }: { cells: string[]; header?: boolean; relation?: string }) {
  return (
    <View style={styles.nameChartRow}>
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[
            styles.nameChartCell,
            index === 0 && styles.nameChartParticularCell,
            index === 1 && styles.nameChartNumberCell,
            header && styles.tableHeadCell,
            !header && index === 2 && isEnemyRelation(relation) && styles.enemyRelationCell,
            index === cells.length - 1 && styles.lastCell
          ]}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.58}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

async function loadNameLetterRelationships(data: NameFrequencyNameChartResponse) {
  const pairs = [
    data.nameNumberWithPersonality,
    data.nameNumberWithDestiny,
    data.firstNameLetterWithNameNumber,
    data.secondNameLetterWithNameNumber,
    data.firstNameLetterWithZodicNumber,
    data.firstAndSecondNameLetterNumber
  ].map(parseRelationshipPair).filter((pair): pair is [number, number] => Boolean(pair));

  const uniquePairs = Array.from(new Map(pairs.map((pair) => [`${pair[0]}-${pair[1]}`, pair])).values());
  try {
    const responses = await Promise.all(uniquePairs.map(([source, target]) => getNumberRelationships(source, target)));
    return responses.flat();
  } catch {
    return [];
  }
}

function getDisplayRelation(numberValue: string | undefined, apiRelation: string | undefined, relationships: NumberRelationshipItem[]) {
  return apiRelation?.trim() || getRelationshipFromRows(numberValue, relationships) || "-";
}

function getRelationshipFromRows(numberValue: string | undefined, relationships: NumberRelationshipItem[]) {
  const pair = parseRelationshipPair(numberValue);
  if (!pair) return "";

  const [source, target] = pair;
  const relationship = relationships.find((item) => Number(item.planetNumber) === source);
  const targetValue = String(target);

  if (numberListIncludes(relationship?.enemyNumbers, targetValue)) return "Enemy";
  if (numberListIncludes(relationship?.friendNumbers, targetValue)) return "Friend";
  if (numberListIncludes(relationship?.neutralNumbers, targetValue)) return "Neutral";
  return "";
}

function parseRelationshipPair(value: string | undefined) {
  const numbers = String(value || "").match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
  if (numbers.length < 2) return null;
  return [numbers[0], numbers[numbers.length - 1]] as [number, number];
}

function numberListIncludes(value: string | undefined, target: string) {
  return (value || "").split(",").map((item) => item.trim()).includes(target);
}

function isEnemyRelation(value: string | undefined) {
  return value?.trim().toLowerCase() === "enemy";
}

function txRelation(value: string, tx: (text: string) => string) {
  return value === "-" ? value : tx(value);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f7f2" },
  header: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    gap: spacing.sm
  },
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "700", fontSize: 12, lineHeight: 19, textAlign: "center" },
  scroll: { flex: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 420, minHeight: "100%", backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  infoTable: { borderWidth: 1, borderColor: "#d6d6d6", borderRadius: 6, backgroundColor: "#fff", overflow: "hidden" },
  infoRow: { minHeight: 34, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d6d6d6" },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { flex: 1, borderRightWidth: 1, borderRightColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 5 },
  infoValue: { flex: 1.35, color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 5 },
  summaryTable: { borderWidth: 1, borderColor: "#d6d6d6", borderRadius: 6, backgroundColor: "#fff", overflow: "hidden" },
  summaryRow: { minHeight: 58, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d6d6d6" },
  summaryCell: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, paddingVertical: 6 },
  cellRightBorder: { borderRightWidth: 1, borderRightColor: "#d6d6d6" },
  summaryLabel: { color: "#777", fontSize: 10, lineHeight: 14, fontWeight: "800", textAlign: "center" },
  summaryValue: { color: "#136a28", fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center", marginTop: 3 },
  tablePanel: { borderWidth: 1, borderColor: "#d6d6d6", borderRadius: 6, backgroundColor: "#fff", overflow: "hidden" },
  tableTitle: { borderBottomWidth: 1, borderBottomColor: "#d6d6d6", color: "#000", fontSize: 15, lineHeight: 18, fontWeight: "700", textAlign: "left", paddingHorizontal: 12, paddingVertical: 8 },
  numberFrequencyTitle: { color: "black", fontSize: 15, lineHeight: 22, fontWeight: "800", textAlign: "left", paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  letterAnalysisTitle: { color: "black", fontSize: 15, lineHeight: 24, fontWeight: "700", textAlign: "left", paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8,borderBottomWidth: 1, borderBottomColor: "#d6d6d6" },
  wideTable: { width: "100%" },
  compactTable: { width: "100%" },
  tableRow: { minHeight: 31, flexDirection: "row" },
  tableCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  tableHeadCell: { backgroundColor: "#354f82",color:"white", fontSize: 12, lineHeight: 15, fontWeight: "700" },
  nameChartTable: { width: "100%" },
  nameChartRow: { minHeight: 36, flexDirection: "row" },
  nameChartCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  nameChartParticularCell: { flex: 1.45 },
  nameChartNumberCell: { flex: 0.95 },
  enemyRelationCell: { color: "#d71920" },
  lastCell: { borderRightWidth: 0 },
  emptyCell: { flex: 1, color: "#777" },
  letterAnalysisTable: { alignSelf: "flex-start" },
  letterAnalysisRow: { minHeight: 27, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#8c8c8c" },
  letterAnalysisLabel: { width: 108, borderRightWidth: 1, borderRightColor: "#8c8c8c", backgroundColor: "#354f82", color: "#fff", fontSize: 11, lineHeight: 14, fontWeight: "500", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 4 },
  letterAnalysisLabelHeader: { fontWeight: "800" },
  letterAnalysisCell: { width: 38, borderRightWidth: 1, borderRightColor: "#8c8c8c", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 4 },
  letterAnalysisHeadCell: { fontWeight: "800" },
  runningAgePanel: {
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  runningAgeTitle: { borderBottomWidth: 1, borderBottomColor: "#d6d6d6", color: "#000", fontSize: 15, lineHeight: 20, fontWeight: "800", textAlign: "left", paddingHorizontal: 12, paddingVertical: 7 },
  runningAgeHeaderRow: { minHeight: 34, flexDirection: "row", backgroundColor: "#354f82" },
  runningAgeRow: { minHeight: 32, flexDirection: "row" },
  runningAgeHeadCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#fff", fontSize: 13, lineHeight: 15, fontWeight: "800", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 3, paddingVertical: 5 },
  runningAgeCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  predictionCard: { borderWidth: 1, borderColor: "#8f8f78", borderRadius: 3, backgroundColor: "#fffff8", overflow: "hidden" },
  predictionRow: { minHeight: 34, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#8f8f78" },
  predictionBodyRow: { minHeight: 58, flexDirection: "row" },
  predictionLabel: { flex: 1, borderRightWidth: 1, borderRightColor: "#8f8f78", color: "#000", fontSize: 11, lineHeight: 14, fontWeight: "900", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 5, paddingVertical: 5 },
  predictionValue: { flex: 1.35, color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "900", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 5, paddingVertical: 5 },
  predictionBody: { flex: 1.35, color: "#000", fontSize: 10, lineHeight: 13, fontWeight: "600", textAlign: "left", textAlignVertical: "top", paddingHorizontal: 5, paddingVertical: 6 },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
