import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { getKundaliBasicDetails, KundaliBasicAstroDetails, KundaliPlanet } from "@/services/kundali.service";
import { useKundaliStore } from "@/store/kundali.store";

const tabs = ["Basic", "Horoscope Charts", "Dasha", "KP", "Bhinnashtakvarga", "Yogas", "Dosha"] as const;

export function KundaliPdfResultScreen() {
  const { language, t } = useTranslation();
  const result = useKundaliStore((state) => state.result);
  const request = useKundaliStore((state) => state.request);
  const setResult = useKundaliStore((state) => state.setResult);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const details = result?.basicAstroDetails;
  const planets = result?.planetaryPositions?.planets || [];

  useEffect(() => {
    if (!request || request.language === language) return;

    let mounted = true;
    const nextRequest = { ...request, language };

    Promise.resolve()
      .then(() => {
        if (!mounted) return null;
        setRefreshing(true);
        setRefreshError("");
        return getKundaliBasicDetails(nextRequest);
      })
      .then((response) => {
        if (mounted && response) setResult(response, nextRequest);
      })
      .catch((error) => {
        if (mounted) setRefreshError(getApiErrorMessage(error, "Unable to fetch Kundali details for selected language"));
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
          {t("Kundali")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text variant="headlineSmall" style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
            {details?.full_name ? `${details.full_name}'s ${t("Kundali")}` : t("Kundali")}
          </Text>
          <Text style={styles.subtitle}>{formatBirthLine(details, request)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable key={tab} disabled={tab !== "Basic"} style={[styles.tab, tab === "Basic" && styles.tabActive, tab !== "Basic" && styles.tabDisabled]}>
              <Text style={[styles.tabText, tab === "Basic" && styles.tabTextActive, tab !== "Basic" && styles.tabTextDisabled]}>{t(tab)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
        {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}

        {!result ? (
          <EmptyState title="No Kundali result" description="Please create a Kundali first." />
        ) : (
          <>
            <InfoCard title="Basic Astro Details" rows={buildBasicAstroRows(details, request)} />
            <PlanetaryPositions planets={planets} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ rows, title }: { rows: { label: string; value?: string | number }[]; title: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t(title)}</Text>
      {rows.map((row, index) => (
        <View key={`${row.label}-${index}`} style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t(row.label)}</Text>
          <Text style={styles.infoValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>{row.value ?? "-"}</Text>
        </View>
      ))}
    </View>
  );
}

function PlanetaryPositions({ planets }: { planets: KundaliPlanet[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t("Planetary Positions")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.planetTable}>
          <PlanetRow cells={[t("Planet"), t("Sign"), t("Degree"), t("Nakshatra"), t("House"), t("Type")]} header />
          {planets.map((planet, index) => (
            <View key={`${planet.name || "planet"}-${index}`} style={styles.planetRow}>
              <View style={[styles.planetCell, styles.planetNameCell]}>
                {planet.image ? <Image source={{ uri: planet.image }} style={styles.planetIcon} /> : null}
                <Text style={styles.planetNameText} numberOfLines={1}>{planet.name_lan || planet.name || "-"}</Text>
              </View>
              <PlanetCell value={planet.sign} />
              <PlanetCell value={planet.longitude} />
              <PlanetCell value={planet.nakshatra} />
              <PlanetCell value={planet.house} />
              <PlanetCell value={planet.type || "-"} last />
            </View>
          ))}
          {!planets.length ? <PlanetRow cells={[t("No records found"), "", "", "", "", ""]} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function PlanetRow({ cells, header = false }: { cells: string[]; header?: boolean }) {
  return (
    <View style={styles.planetRow}>
      {cells.map((cell, index) => (
        <Text key={`${cell}-${index}`} style={[styles.planetCell, header && styles.planetHeadCell, index === 0 && styles.planetNameCell, index === cells.length - 1 && styles.lastCell]}>
          {cell}
        </Text>
      ))}
    </View>
  );
}

function PlanetCell({ last = false, value }: { last?: boolean; value?: string | number }) {
  return (
    <Text style={[styles.planetCell, last && styles.lastCell]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.62}>
      {value ?? "-"}
    </Text>
  );
}

function buildBasicAstroRows(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  return [
    { label: "Name", value: details?.full_name || request?.fullName },
    { label: "Date of Birth", value: formatDate(details, request) },
    { label: "Time of Birth", value: formatTime(details, request) },
    { label: "Gender", value: details?.gender || request?.gender },
    { label: "Place of Birth", value: details?.place || request?.place },
    { label: "Latitude", value: details?.latitude || request?.latitude },
    { label: "Longitude", value: details?.longitude || request?.longitude },
    { label: "Timezone", value: details?.timezone ? `GMT +${details.timezone}` : request?.timeZone },
    { label: "Sunrise", value: details?.sunrise },
    { label: "Sunset", value: details?.sunset },
    { label: "Tithi", value: details?.tithi },
    { label: "Paksha", value: details?.paksha },
    { label: "Paya", value: [details?.paya?.type, details?.paya?.result].filter(Boolean).join(" - ") || undefined },
    { label: "Sunsign", value: details?.sunsign },
    { label: "Moonsign", value: details?.moonsign },
    { label: "Rashi Akshar", value: details?.rashi_akshar },
    { label: "Chandramasa", value: details?.chandramasa },
    { label: "Tatva", value: details?.tatva },
    { label: "Prahar", value: details?.prahar },
    { label: "Nakshatra", value: details?.nakshatra },
    { label: "Vaar", value: details?.vaar },
    { label: "Varna", value: details?.varna },
    { label: "Vashya", value: details?.vashya },
    { label: "Yoni", value: details?.yoni },
    { label: "Gana", value: details?.gana },
    { label: "Nadi", value: details?.nadi },
    { label: "Yoga", value: details?.yoga },
    { label: "Karana", value: details?.karana },
    { label: "Ayanamsha", value: details?.ayanamsha },
    { label: "Yunja", value: details?.yunja }
  ];
}

function formatBirthLine(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  return [formatDate(details, request), formatTime(details, request), details?.place || request?.place].filter(Boolean).join(" · ") || "-";
}

function formatDate(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  const day = details?.day || request?.day;
  const month = details?.month || request?.month;
  const year = details?.year || request?.year;
  return [day, month, year].filter(Boolean).join("-");
}

function formatTime(details?: KundaliBasicAstroDetails, request?: ReturnType<typeof useKundaliStore.getState>["request"]) {
  const hour = details?.hour || request?.hour;
  const minute = details?.minute || request?.min;
  return [hour, minute].filter(Boolean).join(":");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbfbef" },
  header: { minHeight: 58, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.xs },
  title: { color: colors.amber, fontWeight: "900", lineHeight: 31, textAlign: "center" },
  subtitle: { color: colors.cocoa, fontSize: 12, lineHeight: 17, textAlign: "center" },
  tabs: { minHeight: 58, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md },
  tab: { minWidth: 140, minHeight: 38, borderRadius: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.md },
  tabActive: { borderWidth: 1, borderColor: colors.lime, backgroundColor: "#ffffb8" },
  tabDisabled: { opacity: 0.45 },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  tabTextDisabled: { color: colors.cocoa },
  card: { marginHorizontal: spacing.lg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "900", marginBottom: spacing.xs },
  infoRow: { minHeight: 34, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { flex: 1, color: colors.cocoa, fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  infoValue: { flex: 1.2, color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800", textAlign: "right" },
  planetTable: { width: 720, borderTopWidth: 1, borderLeftWidth: 1, borderColor: colors.border },
  planetRow: { minHeight: 40, flexDirection: "row" },
  planetCell: { width: 108, borderRightWidth: 1, borderBottomWidth: 1, borderColor: colors.border, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "700", textAlign: "center", textAlignVertical: "center", paddingHorizontal: 6, paddingVertical: 6 },
  planetHeadCell: { backgroundColor: "#354f82", color: "#fff", fontWeight: "900" },
  planetNameCell: { width: 150, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  planetIcon: { width: 22, height: 22, borderRadius: 11 },
  planetNameText: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "800" },
  lastCell: { borderRightWidth: 0 },
  muted: { marginHorizontal: spacing.lg, color: colors.cocoa },
  errorText: { marginHorizontal: spacing.lg, color: colors.danger, fontWeight: "700" }
});
