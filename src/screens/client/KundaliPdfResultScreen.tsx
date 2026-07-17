import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { generateKundaliPdf } from "@/services/kundali.service";
import { useKundaliStore } from "@/store/kundali.store";
import { getApiLanguageName } from "@/utils/language";

type ActiveTab = "astrologer" | "divine";

export function KundaliPdfResultScreen() {
  const { language, t } = useTranslation();
  const result = useKundaliStore((state) => state.result);
  const request = useKundaliStore((state) => state.request);
  const setResult = useKundaliStore((state) => state.setResult);
  const [activeTab, setActiveTab] = useState<ActiveTab>("astrologer");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const astrology = result?.astrology;
  const divine = result?.divine;

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
    generateKundaliPdf(nextRequest)
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
          {t("Kundali PDF")}
        </Text>
        <LanguageSelector />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Kundali PDF Result")}</Text>
        {refreshing ? <Text style={styles.muted}>{t("Loading response for selected language")}</Text> : null}
        {refreshError ? <Text style={styles.errorText}>{t(refreshError)}</Text> : null}

        <View style={styles.tabs}>
          {(["astrologer", "divine"] as const).map((tab) => (
            <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{t(tab === "astrologer" ? "Astrologer" : "Divine")}</Text>
            </Pressable>
          ))}
        </View>

        {!result ? (
          <EmptyState title="No Kundali PDF result" description="Please generate a Kundali PDF first." />
        ) : activeTab === "astrologer" ? (
          <View style={styles.card}>
            <Text variant="titleLarge" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Astrologer Report")}</Text>
            <Text style={styles.body}>{t(astrology?.msg || "PDF horoscope successfully generated.")}</Text>
            {astrology?.pdf_url ? <UrlButton label="Open PDF" url={astrology.pdf_url} /> : <Text style={styles.muted}>{t("No download URL available")}</Text>}
          </View>
        ) : (
          <View style={styles.card}>
            <Text variant="titleLarge" style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Divine Report")}</Text>
            {divine?.data?.name ? <Text style={styles.body}>{t("Name")}: {divine.data.name}</Text> : null}
            {divine?.message ? <Text style={styles.body}>{t(divine.message)}</Text> : null}
            {divine?.data?.report_url ? <UrlButton label="Open Report" url={divine.data.report_url} /> : null}
            {divine?.data?.download_url ? <UrlButton label="Download PDF" url={divine.data.download_url} /> : null}
            {!divine?.data?.report_url && !divine?.data?.download_url ? <Text style={styles.muted}>{t("No download URL available")}</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UrlButton({ label, url }: { label: string; url: string }) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.urlButton} onPress={() => Linking.openURL(url)}>
      <MaterialCommunityIcons name="open-in-new" size={20} color={colors.ink} />
      <Text style={styles.urlText}>{t(label)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { minHeight: 56, paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerAction: { width: 86, marginLeft: -8 },
  headerTitle: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "center" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  title: { color: colors.ink, fontWeight: "900", lineHeight: 30 },
  tabs: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 3, flexDirection: "row" },
  tab: { flex: 1, minHeight: 42, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: "#fff0c1" },
  tabText: { color: colors.cocoa, fontWeight: "800" },
  tabTextActive: { color: colors.ink },
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  cardTitle: { color: colors.amber, fontWeight: "900", lineHeight: 28 },
  body: { color: colors.ink, lineHeight: 22 },
  muted: { color: colors.cocoa },
  errorText: { color: colors.danger, fontWeight: "700" },
  urlButton: { minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff7df", paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  urlText: { flex: 1, color: colors.ink, fontWeight: "900" }
});
