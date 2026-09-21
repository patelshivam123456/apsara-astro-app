import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

const settingsItems = [
  {
    title: "About Us",
    description: "Learn about Apsara Astro, our services, and our approach to spiritual guidance.",
    icon: "information",
    route: "/(drawer)/about-us"
  },
  {
    title: "Privacy Policy",
    description: "Understand how your account, birth details, reports, payments, and app data are handled.",
    icon: "shield-lock",
    route: "/(drawer)/privacy-policy"
  },
  {
    title: "Terms & Conditions",
    description: "Review the rules for using consultations, reports, wallet, subscriptions, and app services.",
    icon: "file-document-check",
    route: "/(drawer)/terms-and-conditions"
  }
] as const;

export default function Settings() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="cog" size={32} color={colors.amber} />
        <Text variant="headlineSmall" style={styles.title}>{t("Settings")}</Text>
        <Text style={styles.subtitle}>{t("Manage important app information, legal pages, and account-related guidance.")}</Text>
      </View>

      {settingsItems.map((item) => (
        <Pressable key={item.title} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => router.push(item.route)}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={item.icon} size={22} color={colors.amber} />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{t(item.title)}</Text>
            <Text style={styles.rowText}>{t(item.description)}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.cocoa} />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.sm
  },
  title: { color: colors.ink, fontWeight: "900", lineHeight: 31 },
  subtitle: { color: colors.cocoa, lineHeight: 22 },
  row: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fffdf8",
    borderRadius: 8,
    padding: spacing.md
  },
  rowPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff4ce", borderWidth: 1, borderColor: colors.gold, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  rowTitle: { color: colors.ink, fontSize: 15, lineHeight: 19, fontWeight: "900" },
  rowText: { color: colors.cocoa, fontSize: 12, lineHeight: 18 }
});
