import { useEffect } from "react";
import { BackHandler, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { colors, spacing } from "@/constants/theme";

const items = ["Lo Shu grid", "Personal year", "Numeroscope"];

export function NumerologyScreen() {
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/astrologer");
      return true;
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button mode="text" icon="arrow-left" compact onPress={() => router.replace("/astrologer")}>Back</Button>
        <Text variant="headlineSmall" style={styles.headerTitle}>Numerology</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroIcon}>123</Text>
          <Text variant="displaySmall" style={styles.heroTitle}>Numerology</Text>
          <Text style={styles.heroText}>Lo Shu and personal year workflows from the source app.</Text>
        </View>

        {items.map((item) => (
          <Pressable key={item} disabled style={styles.itemCard}>
            <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
            <Text variant="titleLarge" style={styles.itemText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <AstrologerBottomNav active="home" respectSafeArea />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    minHeight: 50,
    // backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg
  },
  headerTitle: { color: colors.ink, fontWeight: "700", fontSize: 15 },
  headerSpacer: { width: 70 },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 104, gap: spacing.lg },
  heroCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.md },
  heroIcon: { color: colors.amber, fontSize: 30, fontWeight: "900" },
  heroTitle: { color: colors.ink },
  heroText: { color: colors.cocoa, fontSize: 20, lineHeight: 30 },
  itemCard: { minHeight: 76, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.lg },
  itemText: { color: colors.ink }
});
