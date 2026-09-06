import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { NumerologyExportButton, NumerologyExportSection } from "@/components/Numerology/NumerologyExport";
import { defaultGrid } from "@/components/Numerology/Lushu-grid/constants";
import { localizeDigitsInText } from "@/components/Numerology/Lushu-grid/utils";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import {
  CompatibilityGridResponse,
  getCompatibilityGrid,
  LoShuGridResponse,
  NumerologyPayload
} from "@/services/numerology.service";
import { translateUniqueTexts } from "@/services/translation.service";

export function CompatibilityRelationshipScreen() {
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
  const mobileNumber = String(params.mobileNumber || "");
  const personA = useMemo<NumerologyPayload>(
    () => ({
      fullName: String(params.fullName || ""),
      dob: String(params.dob || ""),
      gender: String(params.gender || "Male")
    }),
    [params.dob, params.fullName, params.gender]
  );
  const personB = useMemo<NumerologyPayload>(
    () => ({
      fullName: String(params.personBFullName || ""),
      dob: String(params.personBDob || ""),
      gender: String(params.personBGender || "Female")
    }),
    [params.personBDob, params.personBFullName, params.personBGender]
  );
  const [report, setReport] = useState<CompatibilityGridResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasPersonBData = personB.fullName.trim().length > 1 && /^\d{2}-\d{2}-\d{4}$/.test(personB.dob.trim()) && personB.gender;

  useEffect(() => {
    let mounted = true;

    async function loadCompatibility() {
      if (!hasPersonBData) {
        router.replace({
          pathname: "/astrologer/numerology",
          params: {
            fullName: personA.fullName,
            dob: personA.dob,
            gender: personA.gender,
            calculation: "compatibility-relationship",
            mobileNumber,
            personBFullName: personB.fullName,
            personBDob: personB.dob,
            personBGender: personB.gender
          }
        });
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getCompatibilityGrid({ personA, personB });
        if (mounted) setReport(response);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load compatibility report"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCompatibility();
    return () => {
      mounted = false;
    };
  }, [hasPersonBData, mobileNumber, personA, personB]);

  if (loading) return <LoadingState label="Loading compatibility report" />;
  if (error && !report) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        <NumerologyCalculationTabs
          active="compatibility-relationship"
          fullName={personA.fullName}
          dob={personA.dob}
          gender={personA.gender}
          mobileNumber={mobileNumber}
          personBFullName={personB.fullName}
          personBDob={personB.dob}
          personBGender={personB.gender}
        />
        <NumerologyExportButton
          title={`${t("Compatibility/Relationship")} - ${personA.fullName}`}
          fileName={`compatibility-relationship-${personA.fullName}-${personB.fullName}`}
          sections={() => buildCompatibilityExportSections({ language, personA, personB, report, t })}
        />
        <SectionLabel title={t("Compatibility Analysis")} />
        <PersonReportSection title={t("Lo Shu Grid-A")} name={personA.fullName} gender={personA.gender} fallbackDob={personA.dob} data={report?.personA} />
        <PersonReportSection title={t("Lo Shu Grid-B")} name={personB.fullName} gender={personB.gender} fallbackDob={personB.dob} data={report?.personB} />
        <RelationshipChart data={report} />
        <SynergicGridSection data={report} />
        <CompatibilityAnalysisTable data={report} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function buildCompatibilityExportSections({
  language,
  personA,
  personB,
  report,
  t
}: {
  language: ReturnType<typeof useTranslation>["language"];
  personA: NumerologyPayload;
  personB: NumerologyPayload;
  report: CompatibilityGridResponse | null;
  t: ReturnType<typeof useTranslation>["t"];
}): Promise<NumerologyExportSection[]> {
  return translateUniqueTexts([
    "Compatibility/Relationship",
    "Relationship compatibility using both Lo Shu grids and combined numbers.",
    "People Details",
    "Person",
    "Full Name",
    "Date of Birth",
    "Gender",
    "Person A",
    "Person B",
    "Male",
    "Female",
    "Other",
    "Person A Grid",
    "Person A Numbers",
    "Person A Meta",
    "Person B Grid",
    "Person B Numbers",
    "Person B Meta",
    "Top Row",
    "Middle Row",
    "Bottom Row",
    "Name",
    "Date / Zodiac",
    "Compatibility",
    "Particular",
    "Relation",
    "Personality",
    "Destiny",
    "Zodiac",
    "Mixed Grid",
    "Mixed Numbers",
    "Missing Numbers",
    "Repeated Numbers",
    "Mixed Counts",
    "Personality Number",
    "Destiny Number",
    "Kua Number",
    "Name Number",
    "Running Age",
    "Zodiac Number",
    "Compatibility Analysis",
    "Lo Shu Grid-A",
    "Lo Shu Grid-B",
    "Relationship Chart",
    "Particular (Number)",
    "Grid A",
    "Grid B",
    "Synergic Grid",
    "Synergic Arrow Completion",
    "S. No.",
    "Synergic Arrow",
    "Golden Arrow",
    "Mental Arrow",
    "Action Arrow",
    "Compatibility Numerology Analysis",
    "Complementary Number Shared By Grid (A+B)",
    "Complementary Number Shared By Grid (A)",
    "Complementary Number Shared By Grid (B)",
    "Completionary Arrow Completion",
    "Arrow",
    "Inner Nature",
    "Life Path",
    "Years",
    "Zodiac Sign",
    ...[
      report?.compatibility?.personalityStatus,
      report?.compatibility?.destinyStatus,
      report?.compatibility?.zodiacStatus,
      report?.personA?.zodiacSign,
      report?.personB?.zodiacSign
    ].filter((value): value is string => Boolean(value?.trim()))
  ], language).then((translationMap) => {
    const tx = (text: string) => translationMap.get(text) || t(text);
    const relationRows = [
      [tx("Personality"), localizeDigitsInText(report?.personA?.driverNumber ?? "-", language), localizeDigitsInText(report?.personB?.driverNumber ?? "-", language), report?.compatibility?.personalityStatus ? tx(formatRelation(report.compatibility.personalityStatus)) : "-"],
      [tx("Destiny"), localizeDigitsInText(report?.personA?.destinyNumber ?? "-", language), localizeDigitsInText(report?.personB?.destinyNumber ?? "-", language), report?.compatibility?.destinyStatus ? tx(formatRelation(report.compatibility.destinyStatus)) : "-"],
      [tx("Zodiac"), localizeDigitsInText(report?.personA?.zodiacNumber ?? "-", language), localizeDigitsInText(report?.personB?.zodiacNumber ?? "-", language), report?.compatibility?.zodiacStatus ? tx(formatRelation(report.compatibility.zodiacStatus)) : "-"]
    ].flat();
    const synergicArrows = buildSynergicArrowChartRows().flatMap((row) => [
      localizeDigitsInText(row.index, language),
      tx(row.label)
    ]);

    return [
    {
      title: tx("Compatibility/Relationship"),
      variant: "compatibilityPage",
      rows: [
        ["heading", tx("Compatibility Analysis")],
        buildCompatibilityPersonExportRow(tx("Lo Shu Grid-A"), personA.fullName, report?.personA?.dob || personA.dob, personA.gender, report?.personA, language, tx),
        buildCompatibilityPersonExportRow(tx("Lo Shu Grid-B"), personB.fullName, report?.personB?.dob || personB.dob, personB.gender, report?.personB, language, tx),
        [
          "relationship",
          tx("Relationship Chart"),
          tx("Particular (Number)"),
          tx("Grid A"),
          tx("Grid B"),
          tx("Relation"),
          ...relationRows
        ],
        [
          "synergic",
          tx("Synergic Grid"),
          tx("Synergic Arrow Completion"),
          tx("S. No."),
          tx("Synergic Arrow"),
          ...buildGridRows(report?.mixedGrid, report?.mixedCounts).flat().map((value) => localizeDigitsInText(value || "-", language)),
          ...synergicArrows
        ],
        [
          "analysis",
          tx("Compatibility Numerology Analysis"),
          tx("Complementary Number Shared By Grid (A+B)"),
          localizeDigitsInText((report?.mixedRepeatedNumbers || []).join(" ") || "-", language),
          tx("Complementary Number Shared By Grid (A)"),
          localizeDigitsInText((report?.personA?.repeatedNumbers || []).join(" ") || "-", language),
          tx("Complementary Number Shared By Grid (B)"),
          localizeDigitsInText((report?.personB?.repeatedNumbers || []).join(" ") || "-", language),
          tx("Completionary Arrow Completion"),
          localizeDigitsInText(`${countCompletedArrows(report?.mixedCounts || {})} ${tx("Arrow")}`, language)
        ]
      ]
    }
  ];
  });
}

function buildCompatibilityPersonExportRow(
  title: string,
  name: string,
  dob: string,
  gender: string,
  person: LoShuGridResponse | undefined,
  language: ReturnType<typeof useTranslation>["language"],
  tx: (text: string) => string
) {
  return [
    "person",
    title,
    tx("Name"),
    name,
    tx("DOB"),
    localizeDigitsInText(dob || "-", language),
    tx("Gender"),
    tx(gender || "-"),
    tx("Personality Number"),
    localizeDigitsInText(person?.driverNumber ?? "-", language),
    tx("Inner Nature"),
    tx("Destiny Number"),
    localizeDigitsInText(person?.destinyNumber ?? "-", language),
    tx("Life Path"),
    tx("Running Age"),
    localizeDigitsInText(person?.runningAge ?? "-", language),
    tx("Years"),
    tx("Zodiac"),
    localizeDigitsInText(person?.zodiacNumber ?? "-", language),
    person?.zodiacSign ? tx(person.zodiacSign) : tx("Zodiac Sign"),
    ...buildGridRows(person?.grid, person?.counts).flat().map((value) => localizeDigitsInText(value || "-", language))
  ];
}

function SectionLabel({ title }: { title: string }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionLabelText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>{title}</Text>
    </View>
  );
}

function PersonReportSection({
  data,
  fallbackDob,
  gender,
  name,
  title
}: {
  data?: LoShuGridResponse;
  fallbackDob: string;
  gender: string;
  name: string;
  title: string;
}) {
  const { language, t } = useTranslation();
  return (
    <View style={styles.reportBlock}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.infoTable}>
        <InfoRow label={t("Name")} value={name || "-"} />
        <InfoRow label={t("DOB")} value={localizeDigitsInText(data?.dob || fallbackDob || "-", language)} />
        <InfoRow label={t("Gender")} value={t(gender || "-")} last />
      </View>
      <GridTable counts={data?.counts} grid={data?.grid} />
      <View style={styles.numberGrid}>
        <NumberCard label={t("Personality Number")} value={data?.driverNumber} note={t("Inner Nature")} />
        <NumberCard label={t("Destiny Number")} value={data?.destinyNumber} note={t("Life Path")} />
        <NumberCard label={t("Running Age")} value={data?.runningAge} note={t("Years")} />
        <NumberCard label={t("Zodiac")} value={data?.zodiacNumber} note={data?.zodiacSign || t("Zodiac Sign")} />
      </View>
    </View>
  );
}

function NumberCard({ label, note, value }: { label: string; note: string; value?: number }) {
  const { language } = useTranslation();
  return (
    <View style={styles.numberCard}>
      <Text style={styles.numberLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65}>{label}</Text>
      <Text style={styles.numberValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
      <Text style={styles.numberNote} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62}>{note}</Text>
    </View>
  );
}

function RelationshipChart({ data }: { data: CompatibilityGridResponse | null }) {
  const { language, t } = useTranslation();
  const rows = [
    [t("Personality"), data?.personA?.driverNumber, data?.personB?.driverNumber, data?.compatibility?.personalityStatus],
    [t("Destiny"), data?.personA?.destinyNumber, data?.personB?.destinyNumber, data?.compatibility?.destinyStatus],
    [t("Zodiac"), data?.personA?.zodiacNumber, data?.personB?.zodiacNumber, data?.compatibility?.zodiacStatus]
  ];

  return (
    <View style={styles.tablePanel}>
      <View style={styles.relationshipTable}>
        <Text style={styles.relationshipTitle}>{t("Relationship Chart")}</Text>
        <RelationshipRow cells={[t("Particular (Number)"), t("Grid A"), t("Grid B"), t("Relation")]} header />
        {rows.map((row) => (
          <RelationshipRow
            key={String(row[0])}
            cells={[
              String(row[0]),
              localizeDigitsInText(row[1] ?? "-", language),
              localizeDigitsInText(row[2] ?? "-", language),
              row[3] ? t(formatRelation(String(row[3]))) : "-"
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function SynergicGridSection({ data }: { data: CompatibilityGridResponse | null }) {
  const { language, t } = useTranslation();
  const arrows = buildSynergicArrowChartRows();

  return (
    <View style={styles.tablePanel}>
      <SectionLabel title={t("Synergic Grid")} />
      <GridTable counts={data?.mixedCounts} grid={data?.mixedGrid} emphasized />
      <Text style={styles.redTableTitle}>{t("Synergic Arrow Completion")}</Text>
      <View style={styles.table}>
        <TableRow cells={[t("S. No."), t("Synergic Arrow")]} header />
        {arrows.map((row) => (
          <TableRow
            key={row.label}
            cells={[localizeDigitsInText(row.index, language), t(row.label)]}
          />
        ))}
      </View>
    </View>
  );
}

function CompatibilityAnalysisTable({ data }: { data: CompatibilityGridResponse | null }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.tablePanel}>
      <SectionLabel title={t("Compatibility Numerology Analysis")} />
      <View style={styles.countGrid}>
        <InfoRow label={t("Complementary Number Shared By Grid (A+B)")} value={localizeDigitsInText((data?.mixedRepeatedNumbers || []).join(" ") || "-", language)} />
        <InfoRow label={t("Complementary Number Shared By Grid (A)")} value={localizeDigitsInText((data?.personA?.repeatedNumbers || []).join(" ") || "-", language)} />
        <InfoRow label={t("Complementary Number Shared By Grid (B)")} value={localizeDigitsInText((data?.personB?.repeatedNumbers || []).join(" ") || "-", language)} />
        <InfoRow label={t("Completionary Arrow Completion")} value={localizeDigitsInText(`${countCompletedArrows(data?.mixedCounts || {})} ${t("Arrow")}`, language)} last />
      </View>
    </View>
  );
}

function GridTable({
  counts,
  emphasized = false,
  grid
}: {
  counts?: Record<string, number>;
  emphasized?: boolean;
  grid?: LoShuGridResponse["grid"];
}) {
  const { language } = useTranslation();
  const rows = buildGridRows(grid, counts);
  return (
    <View style={[styles.gridShadowWrap, emphasized && styles.gridTableEmphasized]}>
      <View style={styles.gridTable}>
        {rows.map((row, rowIndex) => (
          <View key={`grid-row-${rowIndex}`} style={styles.gridRow}>
            {Array.from({ length: 3 }, (_, colIndex) => {
          const value = row[colIndex] || "";
          return (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.gridCell,
                colIndex === 2 && styles.gridLastColumn,
                rowIndex === 2 && styles.gridLastRow
              ]}
            >
              <Text
                style={[styles.gridCellText, emphasized && value ? styles.gridCellEmphasizedText : null]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
              >
                {localizeDigitsInText(value, language)}
              </Text>
            </View>
          );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { language } = useTranslation();
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{localizeDigitsInText(value, language)}</Text>
    </View>
  );
}

function TableRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={[styles.tableRow, header && styles.tableHeader]}>
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[styles.tableCell, header && styles.tableHeadCell, index === cells.length - 1 && styles.lastCell]}
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

function RelationshipRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.relationshipRow}>
      {cells.map((cell, index) => (
        <Text
          key={`${cell}-${index}`}
          style={[
            styles.relationshipCell,
            index === 0 && styles.relationshipParticularCell,
            (index === 1 || index === 2) && styles.relationshipGridCell,
            index === 3 && styles.relationshipRelationCell,
            header && styles.relationshipHeadCell,
            !header && index === 3 && styles.relationshipRelationText
          ]}
          numberOfLines={index === 0 ? 3 : 2}
          adjustsFontSizeToFit
          minimumFontScale={0.58}
        >
          {cell}
        </Text>
      ))}
    </View>
  );
}

function formatRelation(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function buildSynergicArrowRows() {
  return [
    { index: "1.", label: "Golden Arrow (4-9-2)", numbers: ["4", "9", "2"] },
    { index: "2.", label: "Mental Arrow (3-5-7)", numbers: ["3", "5", "7"] },
    { index: "3.", label: "Action Arrow (8-1-6)", numbers: ["8", "1", "6"] },
    { index: "4.", label: "Top to Bottom Arrow (4-3-8)", numbers: ["4", "3", "8"] },
    { index: "5.", label: "Top to Bottom Arrow (9-5-1)", numbers: ["9", "5", "1"] },
    { index: "6.", label: "Top to Bottom Arrow (2-7-6)", numbers: ["2", "7", "6"] },
    { index: "7.", label: "Left to Right Corner Arrow (4-5-6)", numbers: ["4", "5", "6"] },
    { index: "8.", label: "Right to Left Corner Arrow (2-5-8)", numbers: ["2", "5", "8"] }
  ];
}

function buildSynergicArrowChartRows() {
  return [
    { index: "1.", label: "Golden Arrow" },
    { index: "2.", label: "Mental Arrow" },
    { index: "3.", label: "Action Arrow" }
  ];
}

function countCompletedArrows(counts: Record<string, number>) {
  return buildSynergicArrowRows().reduce((total, arrow) => total + getArrowCount(arrow.numbers, counts), 0);
}

function getArrowCount(numbers: string[], counts: Record<string, number>) {
  return Math.min(...numbers.map((number) => Number(counts[number] || 0)));
}

function buildGridRows(grid?: LoShuGridResponse["grid"], counts?: Record<string, number>) {
  const sourceRows = [grid?.topRow, grid?.middleRow, grid?.bottomRow];
  const positionRows = [defaultGrid.topRow, defaultGrid.middleRow, defaultGrid.bottomRow];

  return positionRows.map((positions, rowIndex) =>
    positions.map((position, colIndex) => {
      const apiValue = sourceRows[rowIndex]?.[colIndex];
      if (apiValue) return apiValue;
      const count = Number(counts?.[position] || 0);
      return count > 0 ? position.repeat(count) : "";
    })
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
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "700", fontSize: 15, lineHeight: 19, textAlign: "center" },
  scroll: { flex: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  sectionLabel: { alignSelf: "center", width: "100%", minHeight: 40, borderRadius: 5, borderWidth: 1, borderColor: "#39a853", backgroundColor: "#bff2c6", alignItems: "flex-start", justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: 6 },
  sectionLabelText: { width: "100%", color: "#145c24", fontSize: 18, lineHeight: 28, fontWeight: "900", textAlign: "left", writingDirection: "ltr", includeFontPadding: true },
  reportBlock: { borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, gap: spacing.md, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  blockTitle: { color: "#111", fontSize: 14, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  numberGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  numberCard: { width: "48.5%", minHeight: 72, borderWidth: 1.2, borderColor: "#39a853", borderRadius: 7, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 5, paddingVertical: 6 },
  numberLabel: { color: "#777", fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
  numberValue: { color: "#136a28", fontSize: 20, lineHeight: 24, fontWeight: "900", textAlign: "center" },
  numberNote: { color: "#777", fontSize: 8, lineHeight: 11, fontWeight: "700", textAlign: "center" },
  tablePanel: { borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  tableTitle: { color: "#111", fontSize: 14, lineHeight: 18, fontWeight: "900", textAlign: "center" },
  relationshipTable: { alignSelf: "center", width: "100%", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  relationshipTitle: { minHeight: 22, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 13, lineHeight: 14, fontWeight: "900", paddingHorizontal: 4, paddingVertical: 3 },
  relationshipRow: { flexDirection: "row", minHeight: 34 },
  relationshipCell: { textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 11, lineHeight: 14, fontWeight: "900", paddingHorizontal: 3, paddingVertical: 4 },
  relationshipHeadCell: { color: "#111", fontSize: 10, lineHeight: 13, fontWeight: "900" },
  relationshipParticularCell: { flex: 1.35 },
  relationshipGridCell: { flex: 0.62 },
  relationshipRelationCell: { flex: 1 },
  relationshipRelationText: { color: "#d71920" },
  redTableTitle: { borderWidth: 1, borderColor: "#f2b7b7", backgroundColor: "#fff", color: "#d71920", fontSize: 14, lineHeight: 18, fontWeight: "900", textAlign: "left", paddingHorizontal: 6, paddingVertical: 5 },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  tableRow: { flexDirection: "row", minHeight: 34 },
  tableHeader: { backgroundColor: "#fff" },
  tableCell: { flex: 1, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 12, lineHeight: 15, fontWeight: "800", paddingHorizontal: 4, paddingVertical: 5 },
  tableHeadCell: { color: "#111", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  lastCell: { borderRightWidth: 1 },
  infoTable: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  infoRow: { minHeight: 32, flexDirection: "row" },
  lastRow: {},
  infoLabel: { flex: 0.75, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#fff", color: "#111", fontSize: 11, lineHeight: 14, fontWeight: "900", paddingHorizontal: 4, paddingVertical: 5 },
  infoValue: { flex: 1.25, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 12, lineHeight: 15, fontWeight: "800", paddingHorizontal: 4, paddingVertical: 5 },
  countGrid: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  gridShadowWrap: {
    alignSelf: "center",
    width: 204,
    height: 138,
    shadowColor: "#777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3
  },
  gridTableEmphasized: { marginVertical: spacing.sm },
  gridTable: {
    width: 204,
    height: 138,
    borderWidth: 1,
    borderColor: "#d7d7d7",
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  gridRow: { height: 45.33, flexDirection: "row" },
  gridCell: {
    width: 67.33,
    height: 45.33,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d7d7d7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 3
  },
  gridLastColumn: { borderRightWidth: 0 },
  gridLastRow: { borderBottomWidth: 0 },
  gridCellText: { width: "100%", color: "#064b82", fontSize: 13, lineHeight: 17, fontWeight: "900", textAlign: "center" },
  gridCellEmphasizedText: { color: "#d71920" },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
