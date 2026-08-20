import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
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
  getChaldeanNamePairEvents
} from "@/services/numerology.service";

const EMPTY_NAME_LETTERS: NonNullable<ChaldeanNameLetterAnalysisChartResponse["nameLetters"]> = [];
const EMPTY_NUMBER_FREQUENCY: NonNullable<ChaldeanNameLetterAnalysisChartResponse["numberFrequency"]> = [];
const FREQUENCY_LABELS = ["Once", "Twice", "Thrice", "Four", "Five", "Six", "Seven", "Eight", "Ninth"];

export function NameFrequencyScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string }>();
  const fullName = String(params.fullName || "");
  const [pairEvents, setPairEvents] = useState<ChaldeanNamePairEventsResponse | null>(null);
  const [letterAnalysis, setLetterAnalysis] = useState<ChaldeanNameLetterAnalysisChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNameFrequency() {
      try {
        setLoading(true);
        setError(null);
        const pairEventResponse = await getChaldeanNamePairEvents(fullName);
        if (!mounted) return;
        setPairEvents(pairEventResponse);

        const letterAnalysisResponse = await getChaldeanNameLetterAnalysisChart(fullName);
        if (mounted) setLetterAnalysis(letterAnalysisResponse);
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
  }, [fullName]);

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
  if (error && !pairEvents) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GridIntro
          title={t("Name Frequency")}
          description={t("Chaldean name pair events and letter frequency analysis.")}
        />
        <NameSummary fullName={letterAnalysis?.fullName || pairEvents?.fullName || fullName} normalizedName={letterAnalysis?.normalizedName || pairEvents?.normalizedName} />
        <SummaryGrid rows={summaryRows} />
        <PairEventsTable data={pairEvents} />
        <NameLettersTable data={letterAnalysis} />
        <NumberFrequencyTable data={letterAnalysis} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
      </ScrollView>
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
  wideTable: { width: 420 },
  compactTable: { width: "100%" },
  tableRow: { minHeight: 31, flexDirection: "row" },
  tableCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  tableHeadCell: { backgroundColor: "#354f82",color:"white", fontSize: 12, lineHeight: 15, fontWeight: "700" },
  lastCell: { borderRightWidth: 0 },
  emptyCell: { flex: 1, color: "#777" },
  letterAnalysisTable: { alignSelf: "flex-start" },
  letterAnalysisRow: { minHeight: 27, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#8c8c8c" },
  letterAnalysisLabel: { width: 108, borderRightWidth: 1, borderRightColor: "#8c8c8c", backgroundColor: "#354f82", color: "#fff", fontSize: 11, lineHeight: 14, fontWeight: "500", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 4 },
  letterAnalysisLabelHeader: { fontWeight: "800" },
  letterAnalysisCell: { width: 38, borderRightWidth: 1, borderRightColor: "#8c8c8c", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 4 },
  letterAnalysisHeadCell: { fontWeight: "800" },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
