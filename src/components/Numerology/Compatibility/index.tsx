import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { NumerologyCalculationTabs } from "@/components/Numerology/CalculationTabs";
import { GridIntro } from "@/components/Numerology/Lushu-grid/Common";
import { LoShuGrid } from "@/components/Numerology/Lushu-grid/LoShuGrid";
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

export function CompatibilityRelationshipScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    fullName?: string;
    dob?: string;
    gender?: string;
    personBFullName?: string;
    personBDob?: string;
    personBGender?: string;
  }>();
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

  useEffect(() => {
    let mounted = true;

    async function loadCompatibility() {
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
  }, [personA, personB]);

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
          personBFullName={personB.fullName}
          personBDob={personB.dob}
          personBGender={personB.gender}
        />
        <GridIntro
          title={t("Compatibility/Relationship")}
          description={t("Relationship compatibility using both Lo Shu grids and combined numbers.")}
        />
        <PeopleGridRow
          personA={report?.personA}
          personB={report?.personB}
          personAName={personA.fullName}
          personBName={personB.fullName}
        />
        <CompatibilityTable data={report} />
        <MixedGrid data={report} />
        {error ? <Text style={styles.validation}>{error}</Text> : null}
      </ScrollView>
      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

function PeopleGridRow({
  personA,
  personAName,
  personB,
  personBName
}: {
  personA?: LoShuGridResponse;
  personAName: string;
  personB?: LoShuGridResponse;
  personBName: string;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleGridRow}>
      <PersonGridCard title={t("Person A")} name={personAName} data={personA} />
      <PersonGridCard title={t("Person B")} name={personBName} data={personB} />
    </ScrollView>
  );
}

function PersonGridCard({ data, name, title }: { data?: LoShuGridResponse; name: string; title: string }) {
  const { language, t } = useTranslation();
  return (
    <View style={styles.gridCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{name || "-"}</Text>
      <LoShuGrid grid={data?.grid} />
      <View style={styles.miniSummary}>
        <MiniCell label={t("Personality Number")} value={data?.driverNumber} />
        <MiniCell label={t("Destiny Number")} value={data?.destinyNumber} />
        <MiniCell label={t("Kua Number")} value={data?.kuaNumber} />
        <MiniCell label={t("Name Number")} value={data?.nameNumber} />
        <MiniCell label={t("Running Age")} value={data?.runningAge} />
        <MiniCell label={t("Zodiac Number")} value={data?.zodiacNumber} />
      </View>
      <Text style={styles.metaLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {localizeDigitsInText(data?.dob || "-", language)}  |  {data?.zodiacSign || "-"}
      </Text>
    </View>
  );
}

function MiniCell({ label, value }: { label: string; value?: number }) {
  const { language } = useTranslation();
  return (
    <View style={styles.miniCell}>
      <Text style={styles.miniLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{label}</Text>
      <Text style={styles.miniValue}>{localizeDigitsInText(value ?? "-", language)}</Text>
    </View>
  );
}

function CompatibilityTable({ data }: { data: CompatibilityGridResponse | null }) {
  const { t } = useTranslation();
  const rows = [
    [t("Personality"), data?.compatibility?.personalityStatus || "-"],
    [t("Destiny"), data?.compatibility?.destinyStatus || "-"],
    [t("Zodiac"), data?.compatibility?.zodiacStatus || "-"]
  ];

  return (
    <View style={styles.tablePanel}>
      <Text style={styles.tableTitle}>{t("Compatibility")}</Text>
      <View style={styles.table}>
        <TableRow cells={[t("Particular"), t("Relation")]} header />
        {rows.map((row) => (
          <TableRow key={row[0]} cells={row} />
        ))}
      </View>
    </View>
  );
}

function MixedGrid({ data }: { data: CompatibilityGridResponse | null }) {
  const { language, t } = useTranslation();
  return (
    <View style={styles.tablePanel}>
      <Text style={styles.tableTitle}>{t("Mixed Grid")}</Text>
      <LoShuGrid grid={data?.mixedGrid} />
      <View style={styles.infoTable}>
        <InfoRow label={t("Missing Numbers")} value={(data?.mixedMissingNumbers || []).join(", ") || "-"} />
        <InfoRow label={t("Repeated Numbers")} value={(data?.mixedRepeatedNumbers || []).join(", ") || "-"} last />
      </View>
      <View style={styles.countGrid}>
        {Array.from({ length: 9 }, (_, index) => String(index + 1)).map((number) => (
          <View key={number} style={styles.countCell}>
            <Text style={styles.countLabel}>{localizeDigitsInText(number, language)}</Text>
            <Text style={styles.countValue}>{localizeDigitsInText(data?.mixedCounts?.[number] ?? "-", language)}</Text>
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
        <Text key={`${cell}-${index}`} style={[styles.tableCell, header && styles.tableHeadCell]}>
          {cell}
        </Text>
      ))}
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
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "700", fontSize: 15, lineHeight: 19, textAlign: "center" },
  scroll: { flex: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 420, backgroundColor: "#ffffc9", padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  peopleGridRow: { gap: spacing.md, paddingRight: spacing.lg },
  gridCard: { width: 254, borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  cardTitle: { color: "#145c24", fontSize: 18, lineHeight: 22, fontWeight: "900" },
  cardName: { color: "#111", fontSize: 14, lineHeight: 18, fontWeight: "900" },
  miniSummary: { flexDirection: "row", flexWrap: "wrap", borderRadius: 6, backgroundColor: "#f8fff6", overflow: "hidden", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#d6dfc9" },
  miniCell: { width: "33.333%", minHeight: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#d6dfc9" },
  miniLabel: { width: "100%", color: "#777", fontSize: 10, lineHeight: 14, fontWeight: "900", textAlign: "center" },
  miniValue: { color: "#136a28", fontSize: 18, lineHeight: 22, fontWeight: "900" },
  metaLine: { color: "#5f665d", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  tablePanel: { borderRadius: 8, backgroundColor: "#fff", padding: spacing.md, gap: spacing.md, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  tableTitle: { color: "#145c24", fontSize: 18, lineHeight: 22, fontWeight: "900" },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  tableRow: { flexDirection: "row", minHeight: 42 },
  tableHeader: { backgroundColor: "#bff2c6" },
  tableCell: { flex: 1, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 13, lineHeight: 18, fontWeight: "800", padding: 6 },
  tableHeadCell: { color: "#145c24", fontWeight: "900" },
  infoTable: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111", backgroundColor: "#fff" },
  infoRow: { minHeight: 42, flexDirection: "row" },
  lastRow: {},
  infoLabel: { flex: 1, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", backgroundColor: "#bff2c6", color: "#145c24", fontSize: 12, lineHeight: 17, fontWeight: "900", padding: 5 },
  infoValue: { flex: 1, textAlign: "center", textAlignVertical: "center", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", color: "#111", fontSize: 13, lineHeight: 18, fontWeight: "800", padding: 5 },
  countGrid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#111" },
  countCell: { width: "33.333%", minHeight: 48, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#111", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  countLabel: { color: "#777", fontSize: 11, lineHeight: 14, fontWeight: "900" },
  countValue: { color: "#111", fontSize: 16, lineHeight: 20, fontWeight: "900" },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
