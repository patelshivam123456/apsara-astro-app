import { Fragment, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { GridIntro } from "@/components/Numerology/Lushu-grid/Common";
import { localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  getPythagoreanGrid,
  getPythagoreanNameTable,
  PythagoreanGridResponse,
  PythagoreanNameTable,
  PythagoreanNameTableResponse
} from "@/services/numerology.service";

export function PythagorasGridScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);
  const [pythagorasGrid, setPythagorasGrid] = useState<PythagoreanGridResponse | null>(null);
  const [nameTable, setNameTable] = useState<PythagoreanNameTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPythagorasGrid() {
      try {
        setLoading(true);
        setError(null);
        const [gridResponse, nameTableResponse] = await Promise.all([
          getPythagoreanGrid(payload),
          getPythagoreanNameTable(fullName, 90)
        ]);
        if (mounted) {
          setPythagorasGrid(gridResponse);
          setNameTable(nameTableResponse);
        }
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load Pythagoras grid"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPythagorasGrid();
    return () => {
      mounted = false;
    };
  }, [fullName, payload]);

  if (loading) return <LoadingState label="Loading Pythagoras grid" />;
  if (error && !pythagorasGrid) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  const challengeNumber = pythagorasGrid?.challengeNumber;
  const pinnacleNumber = pythagorasGrid?.pinnacleNumber;
  const soulNumber = pythagorasGrid?.soulNumber;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact labelStyle={styles.headerButtonLabel} onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GridIntro
          title={t("Pythagoras Grid")}
          description={t("Pythagorean number placement arranged as a Lu Shu style grid for repeated and missing number analysis.")}
        />
        <PythagorasGrid grid={pythagorasGrid?.grid} />
        <StatRow
          items={[
            { label: t("Personality Number"), value: pythagorasGrid?.driverNumber, note: t("Inner Nature") },
            { label: t("Destiny Number"), value: pythagorasGrid?.destinyNumber, note: t("Life Path") }
          ]}
          emphasized
        />
        <CountRow counts={pythagorasGrid?.counts} />
        <MissingRepeatedPanel
          missingNumbers={pythagorasGrid?.missingNumbers}
          repeatedNumbers={pythagorasGrid?.repeatedNumbers}
        />
        <SoulNumberCard name={fullName} soulNumber={soulNumber} />
        <ChallengePinnacleTable
          challengeNumber={challengeNumber}
          pinnacleNumber={pinnacleNumber}
          runningAge={pythagorasGrid?.runningAge}
        />
        <NameValueTable title={t("First Name")} table={nameTable?.firstNameTable} />
        <NameValueTable title={t("Last Name")} table={nameTable?.lastNameTable} />
        <YearSequenceSeries sequence={nameTable?.runningYearSequence} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function PythagorasGrid({ grid }: { grid?: PythagoreanGridResponse["grid"] }) {
  const { language } = useTranslation();
  const rows = [grid?.topRow, grid?.middleRow, grid?.bottomRow].map((row) => row || ["", "", ""]);

  return (
    <View style={styles.pythagorasGrid}>
      {rows.flatMap((row, rowIndex) =>
        row.map((value, columnIndex) => (
          <View key={`${rowIndex}-${columnIndex}`} style={styles.gridCell}>
            <Text style={styles.gridText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.58}>
              {localizeDigitsInText(value || "-", language)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function StatRow({ items, emphasized = false }: { items: { label: string; value?: string | number; note?: string }[]; emphasized?: boolean }) {
  const { language } = useTranslation();

  return (
    <View style={styles.statPanel}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <View style={styles.statDivider} /> : null}
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, emphasized && styles.statLabelEmphasis]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.58}>{item.label}</Text>
            <Text style={[styles.statValue, emphasized && styles.statValueEmphasis]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
              {localizeDigitsInText(item.value ?? "-", language)}
            </Text>
            {item.note ? <Text style={styles.statNote} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>{item.note}</Text> : null}
          </View>
        </Fragment>
      ))}
    </View>
  );
}

function MissingRepeatedPanel({
  missingNumbers,
  repeatedNumbers
}: {
  missingNumbers?: number[];
  repeatedNumbers?: number[];
}) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.missingRepeatedPanel}>
      <View style={styles.missingRepeatedRow}>
        <View style={styles.missingRepeatedCell}>
          <Text style={styles.missingRepeatedLabel}>{t("Missing Numbers")}</Text>
          <View style={styles.missingRepeatedValueDivider} />
          <Text style={styles.missingRepeatedValue}>
            {localizeDigitsInText(formatNumberList(missingNumbers), language)}
          </Text>
        </View>
        <View style={styles.missingRepeatedDivider} />
        <View style={styles.missingRepeatedCell}>
          <Text style={styles.missingRepeatedLabel}>{t("Repeated Numbers")}</Text>
          <View style={styles.missingRepeatedValueDivider} />
          <Text style={styles.missingRepeatedValue}>
            {localizeDigitsInText(formatNumberList(repeatedNumbers), language)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SoulNumberCard({ name, soulNumber }: { name: string; soulNumber?: number }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.soulCard}>
      <View style={styles.soulRow}>
        <Text style={styles.soulLabel}>{t("Name")}</Text>
        <Text style={styles.soulName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
          {name || "-"}
        </Text>
      </View>
      <View style={styles.soulRow}>
        <Text style={styles.soulLabel}>{t("Soul Number")}</Text>
        <Text style={styles.soulValue}>{localizeDigitsInText(soulNumber ?? "-", language)}</Text>
      </View>
    </View>
  );
}

function ChallengePinnacleTable({
  challengeNumber,
  pinnacleNumber,
  runningAge
}: {
  challengeNumber?: PythagoreanGridResponse["challengeNumber"];
  pinnacleNumber?: PythagoreanGridResponse["pinnacleNumber"];
  runningAge?: number;
}) {
  const { language, t } = useTranslation();
  const rows = [
    {
      order: t("First"),
      pinnacle: pinnacleNumber?.firstPinnacleNumber,
      challenge: challengeNumber?.firstChallengeNumber ?? challengeNumber?.challengeOne,
      period: pinnacleNumber?.firstPinnacleTimePeriod ?? pinnacleNumber?.firstChallengeTimePeriod ?? challengeNumber?.firstChallengeTimePeriod
    },
    {
      order: t("Second"),
      pinnacle: pinnacleNumber?.secondPinnacleNumber,
      challenge: challengeNumber?.secondChallengeNumber ?? challengeNumber?.challengeTwo,
      period: pinnacleNumber?.secondPinnacleTimePeriod ?? pinnacleNumber?.secondChallengeTimePeriod ?? challengeNumber?.secondChallengeTimePeriod
    },
    {
      order: t("Third"),
      pinnacle: pinnacleNumber?.thirdPinnacleNumber,
      challenge: challengeNumber?.thirdChallengeNumber ?? challengeNumber?.challengeThree,
      period: pinnacleNumber?.thirdPinnacleTimePeriod ?? pinnacleNumber?.thirdChallengeTimePeriod ?? challengeNumber?.thirdChallengeTimePeriod
    },
    {
      order: t("Forth"),
      pinnacle: pinnacleNumber?.fourthPinnacleNumber,
      challenge: challengeNumber?.fourthChallengeNumber ?? challengeNumber?.challengeFour,
      period: pinnacleNumber?.fourthPinnacleTimePeriod ?? pinnacleNumber?.fourthChallengeTimePeriod ?? challengeNumber?.fourthChallengeTimePeriod
    }
  ];

  return (
    <View style={styles.challengeBlock}>
      <View style={styles.challengeTable}>
        <View style={styles.challengeRow}>
          <Text style={[styles.challengeHeadCell, styles.orderCell]}>{t("Order")}</Text>
          <Text style={styles.challengeHeadCell}>{t("Pinnacle Number")}</Text>
          <Text style={styles.challengeHeadCell}>{t("Challenge Number")}</Text>
          <Text style={styles.challengeHeadCell}>{t("Period (Year)")}</Text>
        </View>
        {rows.map((row) => (
          <View key={row.order} style={styles.challengeRow}>
            <Text style={[styles.challengeCell, styles.orderCell, styles.challengeOrderCell]}>{row.order}</Text>
            <Text style={styles.challengeNumberCell}>{localizeDigitsInText(row.pinnacle ?? "-", language)}</Text>
            <Text style={styles.challengeNumberCell}>{localizeDigitsInText(row.challenge ?? "-", language)}</Text>
            <Text style={styles.challengePeriodCell}>{localizeDigitsInText(row.period || "-", language)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.challengeSummary}>
        <View style={styles.challengeFooterRow}>
          <Text style={styles.challengeFooterLabel}>{t("Running Age")}</Text>
          <Text style={styles.challengeFooterValue}>{localizeDigitsInText(runningAge ?? "-", language)}</Text>
        </View>
        <View style={styles.challengeFooterRow}>
          <Text style={styles.challengeFooterLabel}>{t("Pinnacle Number")}</Text>
          <Text style={styles.challengeFooterValue}>{localizeDigitsInText(getPinnacleSummaryValue(pinnacleNumber), language)}</Text>
        </View>
      </View>
    </View>
  );
}

function getPinnacleSummaryValue(pinnacleNumber?: PythagoreanGridResponse["pinnacleNumber"]) {
  const summary = pinnacleNumber as
    | (PythagoreanGridResponse["pinnacleNumber"] & {
        pinnacleNumber?: string | number;
        pinnacleNo?: string | number;
        finalPinnacleNumber?: string | number;
      })
    | undefined;

  return (
    summary?.pinnacleNumber ??
    summary?.pinnacleNo ??
    summary?.finalPinnacleNumber ??
    summary?.fourthPinnacleNumber ??
    "-"
  );
}

function NameValueTable({ title, table }: { title: string; table?: PythagoreanNameTable }) {
  const { language } = useTranslation();
  const columnCount = Math.max(table?.letters?.length || 0, table?.tableRows?.[0]?.length || 0);
  const columns = columnCount ? Array.from({ length: columnCount }) : [];

  return (
    <View style={styles.nameTablePanel}>
      <Text style={styles.nameTableTitle}>{title}</Text>
      <View style={styles.nameValueTable}>
        <View style={styles.nameValueRow}>
          {columns.map((_, index) => (
            <Text key={`letter-${index}`} style={styles.nameValueHeadCell}>
              {table?.letters?.[index] || ""}
            </Text>
          ))}
        </View>
        {(table?.tableRows?.length ? table.tableRows : [[]]).map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.nameValueRow}>
            {columns.map((_, columnIndex) => (
              <Text key={`${rowIndex}-${columnIndex}`} style={styles.nameValueCell}>
                {localizeDigitsInText(row[columnIndex] ?? "", language)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function YearSequenceSeries({ sequence }: { sequence?: PythagoreanNameTableResponse["runningYearSequence"] }) {
  const { language, t } = useTranslation();
  const rows = getSequenceRows(sequence);

  return (
    <View style={styles.sequencePanel}>
      <Text style={styles.sequenceTitle}>{t("Year Sequence & Series")}</Text>
      <View style={styles.sequenceHeadRow}>
        <Text style={styles.sequenceHeadCell}>{t("Sequence")}</Text>
        <Text style={styles.sequenceHeadCell}>{t("Series of 2")}</Text>
      </View>
      {rows.map((row, index) => (
        <View key={`${row.sequence}-${index}`} style={styles.sequenceRow}>
          <Text style={styles.sequenceCell}>{localizeDigitsInText(row.sequence, language)}</Text>
          <Text style={styles.sequenceCell}>{localizeDigitsInText(row.series, language)}</Text>
        </View>
      ))}
    </View>
  );
}

function getSequenceRows(sequence?: PythagoreanNameTableResponse["runningYearSequence"]) {
  const sequences = sequence?.sequence?.length ? sequence.sequence : ["-"];
  const series = sequence?.twoSeries || [];
  return sequences.map((sequenceValue, index) => ({
    sequence: sequenceValue,
    series: series[index] ?? ""
  }));
}

function CountRow({ counts }: { counts?: Record<string, number> }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.countPanel}>
      <View style={styles.countHeadingBox}>
        <Text style={styles.countHeading} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65}>
          {t("Number count")}
        </Text>
      </View>
      <View style={styles.countRow}>
        {Array.from({ length: 9 }, (_, index) => {
          const numberKey = String(index + 1);
          return (
            <Fragment key={numberKey}>
              {index > 0 ? <View style={styles.countDivider} /> : null}
              <View style={styles.countItem}>
                <Text style={styles.countNumber}>{localizeDigitsInText(numberKey, language)}</Text>
                <Text style={styles.countValue}>{localizeDigitsInText(counts?.[numberKey] ?? 0, language)}</Text>
              </View>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

function formatNumberList(values?: number[]) {
  return values?.length ? values.join(", ") : "-";
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
  headerButtonLabel: { fontWeight: "700" },
  scroll: { flex: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 420, minHeight: "100%", backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  pythagorasGrid: {
    alignSelf: "center",
    width: 204,
    height: 204,
    borderRadius: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 6,
    gap: 4,
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  gridCell: {
    width: 61.33,
    height: 61.33,
    borderRadius: 7,
    backgroundColor: "#f8fff6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  gridText: { color: "#111", fontSize: 13, lineHeight: 30, fontWeight: "600", textAlign: "center" },
  statPanel: {
    minHeight: 86,
    borderRadius: 8,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 5
  },
  statItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    paddingVertical: 8
  },
  statDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#e1e1e1" },
  statLabel: { color: "#777", fontSize: 10, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  statLabelEmphasis: { color: "#111", fontSize: 14, lineHeight: 18, fontWeight: "700" },
  statValue: { color: "#136a28", fontSize: 13, lineHeight: 28, fontWeight: "600", textAlign: "center", marginTop: 3 },
  statValueEmphasis: { fontSize: 13 },
  statNote: { color: "#777", fontSize: 10, lineHeight: 13, fontWeight: "800", textAlign: "center", marginTop: 1 },
  countPanel: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4
  },
  countHeadingBox: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 7
  },
  countHeading: {
    color: "#145c24",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "left"
  },
  countRow: { flex: 1, minHeight: 54, flexDirection: "row", alignItems: "center" },
  countItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6
  },
  countDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#e1e1e1" },
  countNumber: { color: "#777", fontSize: 13, lineHeight: 13, fontWeight: "600", textAlign: "center" },
  countValue: { color: "#136a28", fontSize: 13, lineHeight: 21, fontWeight: "600", textAlign: "center", marginTop: 2 },
  missingRepeatedPanel: {
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5
  },
  missingRepeatedRow: { minHeight: 62, flexDirection: "row" },
  missingRepeatedCell: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  missingRepeatedDivider: { width: 1, backgroundColor: "#d6d6d6" },
  missingRepeatedValueDivider: { width: "100%", height: 1, backgroundColor: "#d6d6d6", marginTop: 7, marginBottom: 6 },
  missingRepeatedLabel: { color: "#000", fontSize: 14, lineHeight: 17, fontWeight: "700", textAlign: "center" },
  missingRepeatedValue: { color: "#000", fontSize: 13, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  soulCard: {
    borderRadius: 8,
    backgroundColor: "#fffdf5",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5
  },
  soulRow: { minHeight: 42, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d6d6d6" },
  soulLabel: { flex: 1, borderRightWidth: 1, borderRightColor: "#d6d6d6", color: "#000", fontSize: 14, lineHeight: 17, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  soulName: { flex: 1.35, color: "#000", fontSize: 14, lineHeight: 17, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  soulValue: { flex: 1.35, color: "#000", fontSize: 13, lineHeight: 17, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  challengeBlock: {
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 0
  },
  challengeTable: {
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  challengeRow: { minHeight: 32, flexDirection: "row" },
  challengeHeadCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", backgroundColor: "#d8f4d1", color: "#000", fontSize: 13, lineHeight: 15, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 3, paddingVertical: 4 },
  challengeCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 15, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 3, paddingVertical: 4 },
  challengeOrderCell: { backgroundColor: "#efffc8" },
  challengeNumberCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", backgroundColor: "#fbffac", color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 3, paddingVertical: 4 },
  challengePeriodCell: { flex: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", backgroundColor: "#fbffac", color: "#000", fontSize: 12, lineHeight: 14, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 3, paddingVertical: 4 },
  orderCell: { flex: 0.75 },
  challengeSummary: { marginTop: 2, borderWidth: 1, borderColor: "#d6d6d6", borderRadius: 6, backgroundColor: "#fff", overflow: "hidden" },
  challengeFooterRow: { minHeight: 28, flexDirection: "row", backgroundColor: "#fff" },
  challengeFooterLabel: { flex: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 15, fontWeight: "700", textAlignVertical: "center", paddingHorizontal: 8, paddingVertical: 4 },
  challengeFooterValue: { flex: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 4 },
  nameTablePanel: {
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4
  },
  nameTableTitle: { color: "#000", fontSize: 13, lineHeight: 17, fontWeight: "700", textAlign: "center", paddingVertical: 6 },
  nameValueTable: { width: "100%" },
  nameValueRow: { minHeight: 25, flexDirection: "row" },
  nameValueHeadCell: { flex: 1, borderTopWidth: 1, borderRightWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 15, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 2, paddingVertical: 4 },
  nameValueCell: { flex: 1, borderTopWidth: 1, borderRightWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 12, lineHeight: 14, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 2, paddingVertical: 4 },
  sequencePanel: {
    borderWidth: 1,
    borderColor: "#d6d6d6",
    borderRadius: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#0d3440",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 4
  },
  sequenceTitle: { borderBottomWidth: 1, borderBottomColor: "#d6d6d6", color: "#000", fontSize: 14, lineHeight: 18, fontWeight: "700", textAlign: "center", paddingHorizontal: 6, paddingVertical: 6 },
  sequenceHeadRow: { minHeight: 28, flexDirection: "row" },
  sequenceHeadCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 13, lineHeight: 16, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  sequenceRow: { minHeight: 27, flexDirection: "row" },
  sequenceCell: { flex: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6d6d6", color: "#000", fontSize: 12, lineHeight: 15, fontWeight: "600", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 4, paddingVertical: 5 },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
