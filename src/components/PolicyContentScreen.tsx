import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";

import { LanguageSelector } from "@/components/LanguageSelector";
import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { translateUniqueTexts } from "@/services/translation.service";
import { useAuthStore } from "@/store/auth.store";

type PolicySection = {
  title: string;
  body: string;
};

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  lastUpdated?: string;
  sections: PolicySection[];
};

export function PolicyContentScreen({ icon, lastUpdated = "Last updated: September 2026", sections, subtitle, title }: Props) {
  const { language, t } = useTranslation();
  const roles = useAuthStore((state) => state.roles);
  const [translationMap, setTranslationMap] = useState<Map<string, string>>(new Map());
  const [translating, setTranslating] = useState(false);
  const textsToTranslate = useMemo(
    () => [
      title,
      subtitle,
      lastUpdated,
      "Apsara Astro is built to support thoughtful spiritual guidance. For urgent medical, legal, financial, or safety matters, please contact a qualified professional or emergency service.",
      ...sections.flatMap((section) => [section.title, section.body])
    ],
    [lastUpdated, sections, subtitle, title]
  );
  const tx = useCallback((text: string) => translationMap.get(text) || t(text), [t, translationMap]);
  const goHome = useCallback(() => {
    const homeRoute = roles.includes("ROLE_CLIENT") && !roles.includes("ROLE_ASTROLOGER")
      ? "/(drawer)/(tabs)"
      : "/astrologer";
    router.replace(homeRoute as never);
  }, [roles]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      goHome();
      return true;
    });

    return () => subscription.remove();
  }, [goHome]);

  useEffect(() => {
    let mounted = true;

    async function translateContent() {
      setTranslationMap(new Map());
      if (language === "en") {
        setTranslating(false);
        return;
      }

      try {
        setTranslating(true);
        const translations = await translateUniqueTexts(textsToTranslate, language);
        if (mounted) setTranslationMap(translations);
      } finally {
        if (mounted) setTranslating(false);
      }
    }

    translateContent();
    return () => {
      mounted = false;
    };
  }, [language, textsToTranslate]);

  return (
    <Screen>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={goHome}>{t("Back")}</Button>
        <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{tx(title)}</Text>
        <LanguageSelector />
      </View>

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name={icon} size={30} color={colors.amber} />
        </View>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{tx(title)}</Text>
        <Text style={styles.subtitle}>{tx(subtitle)}</Text>
        <Text style={styles.updated}>{translating ? t("Translating...") : tx(lastUpdated)}</Text>
      </View>

      {sections.map((section, index) => (
        <View key={`${section.title}-${index}`} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>{tx(section.title)}</Text>
          <Text style={styles.body}>{tx(section.body)}</Text>
        </View>
      ))}

      <View style={styles.note}>
        <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
        <Text style={styles.noteText}>{tx("Apsara Astro is built to support thoughtful spiritual guidance. For urgent medical, legal, financial, or safety matters, please contact a qualified professional or emergency service.")}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, color: colors.ink, fontWeight: "900", textAlign: "center", lineHeight: 25 },
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.sm
  },
  iconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff4ce", borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontWeight: "900", lineHeight: 31 },
  subtitle: { color: colors.cocoa, fontSize: 14, lineHeight: 22 },
  updated: { color: colors.amber, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fffdf8",
    padding: spacing.lg,
    gap: spacing.sm
  },
  sectionTitle: { color: colors.ink, fontWeight: "900", lineHeight: 22 },
  body: { color: colors.cocoa, fontSize: 14, lineHeight: 22 },
  note: { flexDirection: "row", gap: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: "#d7eac8", backgroundColor: "#f8fff5", padding: spacing.md },
  noteText: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: "700" }
});
