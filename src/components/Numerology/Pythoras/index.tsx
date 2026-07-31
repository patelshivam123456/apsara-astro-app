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
import { getPythagoreanGrid, PythagoreanGridResponse } from "@/services/numerology.service";

export function PythagorasGridScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ fullName?: string; dob?: string; gender?: string }>();
  const fullName = String(params.fullName || "");
  const dob = String(params.dob || "");
  const gender = String(params.gender || "Male");
  const payload = useMemo(() => ({ dob, fullName, gender }), [dob, fullName, gender]);
  const [pythagorasGrid, setPythagorasGrid] = useState<PythagoreanGridResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPythagorasGrid() {
      try {
        setLoading(true);
        setError(null);
        const response = await getPythagoreanGrid(payload);
        if (mounted) setPythagorasGrid(response);
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
  }, [payload]);

  if (loading) return <LoadingState label="Loading Pythagoras grid" />;
  if (error && !pythagorasGrid) return <ErrorState message={error} onRetry={() => router.replace("/astrologer/numerology")} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
        <Text variant="headlineSmall" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{t("Numerology")}</Text>
        <LanguageSelector />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GridIntro
          title={t("Pythagoras Grid")}
          description={t("Pythagorean number placement arranged as a Lu Shu style grid for repeated and missing number analysis.")}
        />
        <PythagorasGrid grid={pythagorasGrid?.grid} />
        <CountRow counts={pythagorasGrid?.counts} />
        <StatRow
          items={[
            { label: t("Personality Number"), value: pythagorasGrid?.driverNumber, note: t("Inner Nature") },
            { label: t("Destiny Number"), value: pythagorasGrid?.destinyNumber, note: t("Life Path") },
            { label: t("Name Number"), value: pythagorasGrid?.nameNumber, note: t("Compound") },
            { label: t("Running Age"), value: pythagorasGrid?.runningAge, note: t("Years") }
          ]}
        />
        <StatRow
          items={[
            { label: t("Missing Numbers"), value: formatNumberList(pythagorasGrid?.missingNumbers) },
            { label: t("Repeated Numbers"), value: formatNumberList(pythagorasGrid?.repeatedNumbers) }
          ]}
        />
        <StatRow
          items={[
            { label: t("Challenge One"), value: pythagorasGrid?.challengeNumber?.challengeOne },
            { label: t("Challenge Two"), value: pythagorasGrid?.challengeNumber?.challengeTwo },
            { label: t("Challenge Three"), value: pythagorasGrid?.challengeNumber?.challengeThree },
            { label: t("Challenge Four"), value: pythagorasGrid?.challengeNumber?.challengeFour }
          ]}
        />
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

function StatRow({ items }: { items: { label: string; value?: string | number; note?: string }[] }) {
  const { language } = useTranslation();

  return (
    <View style={styles.statPanel}>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <View style={styles.statDivider} /> : null}
          <View style={styles.statItem}>
            <Text style={styles.statLabel} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.58}>{item.label}</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>
              {localizeDigitsInText(item.value ?? "-", language)}
            </Text>
            {item.note ? <Text style={styles.statNote} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.62}>{item.note}</Text> : null}
          </View>
        </Fragment>
      ))}
    </View>
  );
}

function CountRow({ counts }: { counts?: Record<string, number> }) {
  const { language, t } = useTranslation();

  return (
    <View style={styles.countPanel}>
      <View style={styles.countHeadingBox}>
        <Text style={styles.countHeading} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65}>
          {t("Count Number")}
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
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "700", fontSize: 15, lineHeight: 19, textAlign: "center" },
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
  gridText: { color: "#111", fontSize: 24, lineHeight: 30, fontWeight: "900", textAlign: "center" },
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
  statDivider: { width: 1, height: 54, backgroundColor: "#e1e1e1" },
  statLabel: { color: "#777", fontSize: 11, lineHeight: 15, fontWeight: "900", textAlign: "center" },
  statValue: { color: "#136a28", fontSize: 22, lineHeight: 28, fontWeight: "900", textAlign: "center", marginTop: 3 },
  statNote: { color: "#777", fontSize: 9, lineHeight: 13, fontWeight: "800", textAlign: "center", marginTop: 1 },
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
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
  countDivider: { width: 1, height: 30, backgroundColor: "#e1e1e1" },
  countNumber: { color: "#777", fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
  countValue: { color: "#136a28", fontSize: 17, lineHeight: 21, fontWeight: "900", textAlign: "center", marginTop: 2 },
  validation: { color: colors.danger, fontSize: 12, fontWeight: "800", lineHeight: 17 }
});
