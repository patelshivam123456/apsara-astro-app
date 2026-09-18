import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { generateMatchMakingPdf, MatchMakingReportResponse } from "@/services/kundali.service";
import { useMatchMakingStore } from "@/store/matchMaking.store";

type ReportType = "others" | "horoscopeCharts";

export function MatchMakingPdfResultScreen() {
  const { language, t } = useTranslation();
  const result = useMatchMakingStore((state) => state.result);
  const request = useMatchMakingStore((state) => state.request);
  const setResult = useMatchMakingStore((state) => state.setResult);
  const [activeReport, setActiveReport] = useState<ReportType>("others");
  const [activeSections, setActiveSections] = useState<Record<ReportType, string>>({ others: "", horoscopeCharts: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const currentData = activeReport === "others" ? result?.others : result?.horoscopeCharts;
  const sectionKeys = useMemo(() => getSectionKeys(currentData, activeReport), [activeReport, currentData]);
  const activeSection = sectionKeys.includes(activeSections[activeReport]) ? activeSections[activeReport] : sectionKeys[0] || "";
  const activeValue = activeSection && currentData ? currentData[activeSection] : currentData;

  useEffect(() => {
    if (!sectionKeys.length) return;
    setActiveSections((current) => sectionKeys.includes(current[activeReport]) ? current : { ...current, [activeReport]: sectionKeys[0] });
  }, [activeReport, sectionKeys]);

  useEffect(() => {
    if (!request || request.languageCode === language) return;

    let mounted = true;
    const nextRequest = {
      ...request,
      language,
      languageCode: language
    };

    setRefreshing(true);
    setRefreshError("");
    generateMatchMakingPdf(nextRequest)
      .then((response) => {
        if (mounted) setResult(response, nextRequest);
      })
      .catch((error) => {
        if (mounted) setRefreshError(getApiErrorMessage(error, "Unable to generate response for selected language"));
      })
      .finally(() => {
        if (mounted) setRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [language, request, setResult]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact style={styles.headerAction} onPress={() => router.back()}>
          {t("Back")}
        </Button>
        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {t("Match Making PDF")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Match Making PDF Result")}</Text>
        {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
        {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {(["others", "horoscopeCharts"] as const).map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeReport === tab && styles.tabActive]} onPress={() => setActiveReport(tab)}>
              <Text style={[styles.tabText, activeReport === tab && styles.tabTextActive]}>{t(tab === "others" ? "Others" : "Horoscope-chart")}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!result ? (
          <EmptyState title="No Match Making result" description="Please submit match making details first." />
        ) : (
          <>
            {request ? <MatchSummary request={request} /> : null}
            {sectionKeys.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
                {sectionKeys.map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.sectionTab, activeSection === key && styles.sectionTabActive]}
                    onPress={() => setActiveSections((current) => ({ ...current, [activeReport]: key }))}
                  >
                    <Text style={[styles.sectionTabText, activeSection === key && styles.sectionTabTextActive]}>{formatKey(key)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.card}>
              <Text variant="titleLarge" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
                {formatKey(activeSection || (activeReport === "others" ? "Others" : "Horoscope-chart"))}
              </Text>
              <ReportValue value={activeValue} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MatchSummary({ request }: { request: NonNullable<ReturnType<typeof useMatchMakingStore.getState>["request"]> }) {
  return (
    <View style={styles.summaryCard}>
      <PersonSummary
        title="Person 1"
        name={request.p1FullName}
        date={`${request.p1Day}-${request.p1Month}-${request.p1Year}`}
        time={`${request.p1Hour}:${request.p1Min}`}
        place={request.p1Place}
      />
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>MATCH</Text>
      </View>
      <PersonSummary
        title="Person 2"
        name={request.p2FullName}
        date={`${request.p2Day}-${request.p2Month}-${request.p2Year}`}
        time={`${request.p2Hour}:${request.p2Min}`}
        place={request.p2Place}
      />
    </View>
  );
}

function PersonSummary({
  date,
  name,
  place,
  time,
  title
}: {
  date: string;
  name: string;
  place: string;
  time: string;
  title: string;
}) {
  return (
    <View style={styles.personSummary}>
      <Text style={styles.personKicker}>{title}</Text>
      <Text style={styles.personName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{name || "-"}</Text>
      <Text style={styles.personMeta} numberOfLines={1}>{date} | {time}</Text>
      <Text style={styles.personPlace} numberOfLines={2}>{place || "-"}</Text>
    </View>
  );
}

function ReportValue({ label, value }: { label?: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    if (isImageValue(value, label)) {
      return (
        <View style={styles.imageBlock}>
          {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
          <RemoteImage value={value} />
        </View>
      );
    }

    return (
      <View style={styles.valueRow}>
        {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
        <Text style={styles.body}>{value}</Text>
      </View>
    );
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <View style={styles.valueRow}>
        {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
        <Text style={styles.body}>{String(value)}</Text>
      </View>
    );
  }

  if (Array.isArray(value)) {
    return <ArrayTable label={label} rows={value} />;
  }

  if (typeof value === "object") {
    return <ObjectTable label={label} value={value as Record<string, unknown>} />;
  }

  return null;
}

function ObjectTable({ label, value }: { label?: string; value: Record<string, unknown> }) {
  const entries = Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "");

  if (hasPersonPair(value)) {
    return <PersonComparisonTable label={label} p1={value.p1 as Record<string, unknown>} p2={value.p2 as Record<string, unknown>} />;
  }

  return (
    <View style={styles.valueGroup}>
      {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {entries.map(([key, item]) => (
            <View key={key} style={styles.tableRow}>
              <Text style={styles.tableKeyCell}>{formatKey(key)}</Text>
              <View style={styles.tableValueCell}>
                <TableCellValue label={key} value={item} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ArrayTable({ label, rows }: { label?: string; rows: unknown[] }) {
  if (!rows.length) return null;
  const objectRows = rows.filter(isRecord);

  if (objectRows.length === rows.length) {
    const columns = Array.from(new Set(objectRows.flatMap((row) => Object.keys(row))));
    return (
      <View style={styles.valueGroup}>
        {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridTable}>
            <View style={styles.gridRow}>
              {columns.map((column) => (
                <Text key={column} style={styles.gridHeadCell}>{formatKey(column)}</Text>
              ))}
            </View>
            {objectRows.map((row, index) => (
              <View key={index} style={styles.gridRow}>
                {columns.map((column) => (
                  <View key={`${index}-${column}`} style={styles.gridCell}>
                    <TableCellValue label={column} value={row[column]} compact />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.valueGroup}>
      {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {rows.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableKeyCell}>{String(index + 1)}</Text>
              <View style={styles.tableValueCell}>
                <TableCellValue value={item} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PersonComparisonTable({
  label,
  p1,
  p2
}: {
  label?: string;
  p1: Record<string, unknown>;
  p2: Record<string, unknown>;
}) {
  const [activePerson, setActivePerson] = useState<"p1" | "p2">("p1");
  const activeData = activePerson === "p1" ? p1 : p2;
  return (
    <View style={styles.valueGroup}>
      {label ? <Text style={styles.valueLabel}>{formatKey(label)}</Text> : null}
      <View style={styles.personTabs}>
        {(["p1", "p2"] as const).map((personKey) => (
          <Pressable
            key={personKey}
            style={[styles.personTab, activePerson === personKey && styles.personTabActive]}
            onPress={() => setActivePerson(personKey)}
          >
            <Text style={[styles.personTabText, activePerson === personKey && styles.personTabTextActive]}>
              {formatKey(personKey)}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {Object.entries(activeData).map(([key, item]) => (
            <View key={key} style={styles.tableRow}>
              <Text style={styles.tableKeyCell}>{formatKey(key)}</Text>
              <View style={styles.tableValueCell}>
                <TableCellValue label={key} value={item} compact />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TableCellValue({ compact = false, label, value }: { compact?: boolean; label?: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return <Text style={styles.tableText}>-</Text>;

  if (typeof value === "string") {
    if (isImageValue(value, label)) return <RemoteImage value={value} compact={compact} />;
    return <Text style={styles.tableText}>{value}</Text>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <Text style={styles.tableText}>{String(value)}</Text>;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <Text style={styles.tableText}>-</Text>;
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return <Text style={styles.tableText}>{value.map(String).join(", ")}</Text>;
    }
    return <ArrayTable rows={value} />;
  }

  if (isRecord(value)) return <ObjectTable value={value} />;

  return <Text style={styles.tableText}>{String(value)}</Text>;
}

function RemoteImage({ compact = false, value }: { compact?: boolean; value: string }) {
  const [uri, setUri] = useState(() => normalizeImageUri(value));

  useEffect(() => {
    let mounted = true;

    async function loadSvgUrl() {
      if (!shouldFetchAsSvg(value)) {
        setUri(normalizeImageUri(value));
        return;
      }

      try {
        const response = await fetch(value);
        const svgText = await response.text();
        if (mounted) setUri(svgText.trim().startsWith("<svg") ? toSvgDataUri(svgText) : value);
      } catch {
        if (mounted) setUri(value);
      }
    }

    loadSvgUrl();
    return () => {
      mounted = false;
    };
  }, [value]);

  return <Image source={{ uri }} style={[styles.reportImage, compact && styles.compactImage]} contentFit="contain" />;
}

function getSectionKeys(data: MatchMakingReportResponse | undefined, reportType: ReportType) {
  if (!data || typeof data !== "object") return [];
  const keys = Object.keys(data).filter((key) => data[key] !== null && data[key] !== undefined);
  if (reportType !== "horoscopeCharts") return keys;
  return [...keys].sort(compareChartKeys);
}

function isImageValue(value: string, label?: string) {
  const clean = value.trim();
  const labelText = String(label || "").toLowerCase();
  return (
    isSvgUrl(clean) ||
    clean.startsWith("<svg") ||
    clean.startsWith("data:image/") ||
    /\.(png|jpe?g|webp)(\?|#|$)/i.test(clean) ||
    (/^https?:\/\//i.test(clean) && /(svg|chart|image|img|kundali|horoscope)/i.test(labelText))
  );
}

function isSvgUrl(value: string) {
  return /\.svg(\?|#|$)/i.test(value.trim());
}

function shouldFetchAsSvg(value: string) {
  const clean = value.trim();
  return isSvgUrl(clean) || /^https?:\/\//i.test(clean);
}

function normalizeImageUri(value: string) {
  const clean = value.trim();
  if (clean.startsWith("<svg")) return toSvgDataUri(clean);
  return clean;
}

function hasPersonPair(value: Record<string, unknown>) {
  return isRecord(value.p1) && isRecord(value.p2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function compareChartKeys(a: string, b: string) {
  const first = getChartNumber(a);
  const second = getChartNumber(b);
  if (first !== null && second !== null) return first - second;
  if (first !== null) return -1;
  if (second !== null) return 1;
  return a.localeCompare(b);
}

function getChartNumber(value: string) {
  const match = value.trim().match(/^d[\s_-]*(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function toSvgDataUri(svgText: string) {
  return `data:image/svg+xml;base64,${base64EncodeUtf8(svgText)}`;
}

function base64EncodeUtf8(value: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = encodeUtf8(value);
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    output += chars[first >> 2];
    output += chars[((first & 3) << 4) | ((second ?? 0) >> 4)];
    output += second === undefined ? "=" : chars[((second & 15) << 2) | ((third ?? 0) >> 6)];
    output += third === undefined ? "=" : chars[third & 63];
  }

  return output;
}

function encodeUtf8(value: string) {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      const next = value.charCodeAt(++index);
      const point = 0x10000 + (((code & 0x3ff) << 10) | (next & 0x3ff));
      bytes.push(0xf0 | (point >> 18), 0x80 | ((point >> 12) & 0x3f), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
    }
  }
  return bytes;
}

function formatKey(value: string) {
  const clean = value.trim();
  if (/^p1$/i.test(clean)) return "Person 1";
  if (/^p2$/i.test(clean)) return "Person 2";
  if (/^d[\s_-]*\d+$/i.test(clean)) return clean.replace(/[\s_-]+/g, "").toUpperCase();

  return clean
    .replace(/^p1(?=[A-Z_-])/, "Person 1 ")
    .replace(/^p2(?=[A-Z_-])/, "Person 2 ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff8df" },
  header: { minHeight: 56, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { color: "#5f3b00", fontWeight: "900", lineHeight: 30 },
  summaryCard: { borderRadius: 8, borderWidth: 1, borderColor: "#f0dca2", backgroundColor: colors.surface, padding: spacing.md, flexDirection: "row", alignItems: "stretch", gap: spacing.sm, shadowColor: "#6b4a00", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 7, elevation: 3 },
  personSummary: { flex: 1, minWidth: 0, borderRadius: 8, backgroundColor: "#fffaf0", padding: spacing.md, gap: 3 },
  personKicker: { color: colors.cocoa, fontSize: 10, lineHeight: 13, fontWeight: "900" },
  personName: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  personMeta: { color: "#8a5d00", fontSize: 11, lineHeight: 15, fontWeight: "800" },
  personPlace: { color: colors.cocoa, fontSize: 11, lineHeight: 15, fontWeight: "600" },
  matchBadge: { width: 52, borderRadius: 8, backgroundColor: "#ffd45d", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  matchBadgeText: { color: "#5f3b00", fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
  tabs: { minWidth: "100%", borderRadius: 8, borderWidth: 1, borderColor: "#f0dca2", backgroundColor: colors.surface, padding: 3, flexDirection: "row", gap: 3 },
  tab: { minWidth: 150, minHeight: 42, borderRadius: 6, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  tabActive: { backgroundColor: "#ffd45d" },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  sectionTabs: { gap: spacing.sm, paddingVertical: 2 },
  sectionTab: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  sectionTabActive: { borderColor: "#ffd45d", backgroundColor: "#fff0c1" },
  sectionTabText: { color: colors.cocoa, fontWeight: "800" },
  sectionTabTextActive: { color: colors.ink },
  personTabs: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fffaf0", padding: 3, flexDirection: "row", gap: 3 },
  personTab: { flex: 1, minHeight: 38, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  personTabActive: { backgroundColor: "#ffd45d" },
  personTabText: { color: colors.cocoa, fontWeight: "800" },
  personTabTextActive: { color: colors.ink },
  card: { borderRadius: 8, borderWidth: 1, borderColor: "#f0dca2", backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  nestedCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fffdf4", padding: spacing.md, gap: spacing.sm },
  cardTitle: { color: "#5f3b00", fontWeight: "900", lineHeight: 28 },
  valueGroup: { gap: spacing.sm },
  valueRow: { gap: 4 },
  imageBlock: { gap: spacing.sm },
  valueLabel: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  body: { color: colors.ink, lineHeight: 22 },
  muted: { color: colors.cocoa },
  errorText: { color: colors.danger, fontWeight: "700" },
  table: { minWidth: 620, borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  tableRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  tableKeyCell: { flex: 0.8, backgroundColor: "#fff0c1", borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlignVertical: "center", padding: spacing.sm },
  tableValueCell: { flex: 1.4, minWidth: 0, justifyContent: "center", padding: spacing.sm },
  tableText: { color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  gridTable: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  gridRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  gridHeadCell: { width: 132, backgroundColor: "#fff0c1", borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlign: "center", textAlignVertical: "center", padding: spacing.sm },
  gridCell: { width: 132, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: "center", padding: spacing.sm },
  compareTable: { minWidth: 760, borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  compareRow: { minHeight: 38, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },
  compareHeadCell: { flex: 1, backgroundColor: "#fff0c1", borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlign: "center", textAlignVertical: "center", padding: spacing.sm },
  compareKeyCell: { flex: 1, backgroundColor: "#fffaf0", borderRightWidth: 1, borderRightColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlignVertical: "center", padding: spacing.sm },
  compareCell: { flex: 1, minWidth: 0, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: "center", padding: spacing.sm },
  reportImage: { width: "100%", height: 320, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  compactImage: { height: 170 }
});
