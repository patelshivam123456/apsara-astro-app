import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { BasicAstroDetails, getBasicAstroDetails } from "@/services/astroProfile.service";
import { useAstroProfileStore } from "@/store/astroProfile.store";
import { getApiLanguageName } from "@/utils/language";

type ActiveTab = "profile" | "signs" | "panchang" | "traits";
type ProviderTab = "astrology" | "divine";
type DetailRow = { label: string; value?: string | number | null };
type DetailSection = { title: string; rows: DetailRow[] };

const providerTabs: { key: ProviderTab; label: string }[] = [
  { key: "astrology", label: "Astrology" },
  { key: "divine", label: "Divine" }
];

export function AstroProfileResultScreen() {
  const { language, t } = useTranslation();
  const result = useAstroProfileStore((state) => state.result);
  const request = useAstroProfileStore((state) => state.request);
  const setResult = useAstroProfileStore((state) => state.setResult);
  const [activeTab, setActiveTab] = useState<ProviderTab>("divine");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const details = result?.divine?.data;
  const divineSections = useMemo(() => details ? getDivineSections(details) : [], [details]);
  const astrologyRows = useMemo(() => getUnknownRows(result?.astrology), [result?.astrology]);

  useEffect(() => {
    if (!request || request.languageCode === language) return;

    let mounted = true;
    const nextRequest = {
      ...request,
      language: getApiLanguageName(language),
      languageCode: language
    };

    setRefreshing(true);
    setRefreshError("");
    getBasicAstroDetails(nextRequest)
      .then((response) => {
        if (mounted) setResult(response, nextRequest);
      })
      .catch((error) => {
        if (mounted) setRefreshError(getApiErrorMessage(error, "Unable to load response for selected language"));
      })
      .finally(() => {
        if (mounted) setRefreshing(false);
      });

    return () => {
      mounted = false;
    };
  }, [language, request, setResult]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact style={styles.headerAction} onPress={() => router.back()}>
          {t("Back")}
        </Button>
        <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
          {t("Apsara Astro Profile")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text variant="headlineSmall" style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Apsara Astro Profile Result")}</Text>
          {details?.full_name ? <Text style={styles.muted}>{details.full_name}</Text> : null}
          {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
          {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}
        </View>

        {!result ? (
          <EmptyState title="No Apsara Astro Profile result" description="Please submit birth details first." />
        ) : (
          <>
            <View style={styles.tabs}>
              {providerTabs.map((tab) => (
                <Pressable key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{t(tab.label)}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === "astrology" ? (
              astrologyRows.length ? (
                <View style={styles.card}>
                  {astrologyRows.map((row) => (
                    <DetailItem key={row.label} label={row.label} value={row.value} />
                  ))}
                </View>
              ) : (
                <EmptyState title="No Astrology data" description="The astrology response is empty for this profile." />
              )
            ) : details ? (
              divineSections.map((section) => (
                <View key={section.title} style={styles.card}>
                  <Text style={styles.sectionTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t(section.title)}</Text>
                  {section.rows.map((row) => (
                    <DetailItem key={row.label} label={row.label} value={row.value} />
                  ))}
                </View>
              ))
            ) : (
              <EmptyState title="No Divine data" description="The divine response is empty for this profile." />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }: DetailRow) {
  const { t } = useTranslation();
  if (value === undefined || value === null || value === "") return null;

  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{t(label)}</Text>
      <Text style={styles.detailValue}>{t(String(value))}</Text>
    </View>
  );
}

function getDivineSections(details: BasicAstroDetails): DetailSection[] {
  return [
    {
      title: "Profile",
      rows: [
      { label: "Full Name", value: details.full_name },
      { label: "Gender", value: details.gender },
      { label: "Date", value: formatDate(details) },
      { label: "Time", value: formatTime(details) },
      { label: "Place", value: details.place },
      { label: "Latitude", value: details.latitude },
      { label: "Longitude", value: details.longitude },
      { label: "Timezone", value: details.timezone },
      { label: "Sunrise", value: details.sunrise },
      { label: "Sunset", value: details.sunset }
      ]
    },
    {
      title: "Signs",
      rows: [
      { label: "Sun Sign", value: details.sunsign },
      { label: "Moon Sign", value: details.moonsign },
      { label: "Rashi Akshar", value: details.rashi_akshar },
      { label: "Nakshatra", value: details.nakshatra },
      { label: "Chandramasa", value: details.chandramasa },
      { label: "Tatva", value: details.tatva }
      ]
    },
    {
      title: "Panchang",
      rows: [
      { label: "Tithi", value: details.tithi },
      { label: "Paksha", value: details.paksha },
      { label: "Vaar", value: details.vaar },
      { label: "Yoga", value: details.yoga },
      { label: "Karana", value: details.karana },
      { label: "Prahar", value: details.prahar },
      { label: "Ayanamsha", value: details.ayanamsha },
      { label: "Yunja", value: details.yunja }
      ]
    },
    {
      title: "Traits",
      rows: [
        { label: "Paya Type", value: details.paya?.type },
        { label: "Paya Result", value: details.paya?.result },
        { label: "Varna", value: details.varna },
        { label: "Vashya", value: details.vashya },
        { label: "Yoni", value: details.yoni },
        { label: "Gana", value: details.gana },
        { label: "Nadi", value: details.nadi }
      ]
    }
  ];
}

function getUnknownRows(value: unknown, prefix = ""): DetailRow[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    const label = prefix ? `${prefix} ${toTitle(key)}` : toTitle(key);

    if (item === null || item === undefined || item === "") return [];
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      return [{ label, value: String(item) }];
    }
    if (Array.isArray(item)) {
      return [{ label, value: item.map((entry) => typeof entry === "object" ? JSON.stringify(entry) : String(entry)).join(", ") }];
    }
    return getUnknownRows(item, label);
  });
}

function toTitle(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(details: BasicAstroDetails) {
  return [details.day, details.month, details.year].filter(Boolean).join("-");
}

function formatTime(details: BasicAstroDetails) {
  return [details.hour, details.minute].filter(Boolean).join(":");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { minHeight: 56, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  titleBlock: { gap: spacing.xs },
  title: { color: colors.ink, fontWeight: "900", lineHeight: 30 },
  muted: { color: colors.cocoa },
  errorText: { color: colors.danger, fontWeight: "700" },
  tabs: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 3, flexDirection: "row" },
  tab: { flex: 1, minHeight: 42, borderRadius: 6, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  tabActive: { backgroundColor: "#fff0c1" },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  sectionTitle: { padding: spacing.md, paddingBottom: spacing.sm, color: colors.amber, fontSize: 16, lineHeight: 20, fontWeight: "900" },
  detailItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  detailLabel: { color: colors.cocoa, fontSize: 12, fontWeight: "800" },
  detailValue: { color: colors.ink, fontSize: 15, fontWeight: "800", lineHeight: 21 }
});
