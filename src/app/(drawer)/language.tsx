import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { languages, useTranslation } from "@/context/LanguageContext";

export default function Language() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <Screen>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="translate" size={32} color={colors.amber} />
        <Text variant="headlineSmall">{t("Language")}</Text>
        <Text style={styles.subtitle}>{t("Choose Language")}</Text>
      </View>
      {languages.map((item) => (
        <Pressable
          key={item.code}
          style={[styles.row, language === item.code && styles.rowActive]}
          onPress={() => setLanguage(item.code)}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.code}>{item.code.toUpperCase()}</Text>
          </View>
          <View style={styles.languageCopy}>
            <Text style={styles.native}>{item.nativeLabel}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
          {language === item.code ? <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} /> : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.xl, gap: spacing.sm },
  subtitle: { color: colors.cocoa, lineHeight: 22 },
  row: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff9ef", borderRadius: 8, padding: spacing.md },
  rowActive: { borderColor: colors.success, backgroundColor: "#efffed" },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  code: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  languageCopy: { flex: 1 },
  native: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  label: { color: colors.cocoa, fontSize: 12, marginTop: 2 }
});
