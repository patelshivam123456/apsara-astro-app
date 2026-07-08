import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { languages, useTranslation } from "@/context/LanguageContext";

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const selected = languages.find((item) => item.code === language) || languages[0];

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.iconButton} onPress={() => setOpen((value) => !value)} hitSlop={8}>
        <MaterialCommunityIcons name="translate" size={21} color="#145c24" />
        <Text style={styles.shortCode}>{selected.code.toUpperCase()}</Text>
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>{t("Choose Language")}</Text>
          {languages.map((item) => (
            <Pressable
              key={item.code}
              style={[styles.languageRow, language === item.code && styles.languageRowActive]}
              onPress={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
            >
              <Text style={[styles.languageText, language === item.code && styles.languageTextActive]}>
                {item.nativeLabel}
              </Text>
              <Text style={styles.languageSubText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", zIndex: 30 },
  iconButton: { minWidth: 48, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "#c8e7c7", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 7 },
  shortCode: { color: "#145c24", fontSize: 10, fontWeight: "900" },
  menu: { position: "absolute", right: 0, top: 40, width: 190, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: spacing.sm, gap: 4, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 5, elevation: 8 },
  menuTitle: { color: colors.cocoa, fontSize: 12, fontWeight: "900", marginBottom: 2 },
  languageRow: { borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 7 },
  languageRowActive: { backgroundColor: "#d9f6d8" },
  languageText: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  languageTextActive: { color: "#145c24" },
  languageSubText: { color: colors.cocoa, fontSize: 10, marginTop: 1 }
});
