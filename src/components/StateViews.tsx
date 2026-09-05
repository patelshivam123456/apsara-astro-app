import { Animated, Image, StyleSheet, View } from "react-native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Button, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  const { t } = useTranslation();
  const pulse = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.88, duration: 720, useNativeDriver: true })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.center}>
      <Animated.View style={[styles.loadingLogoWrap, { transform: [{ scale: pulse }] }]}>
        <Image source={require("@/assets/new_logo_apsara.jpeg")} resizeMode="contain" style={styles.loadingLogo} />
      </Animated.View>
      <ActivityIndicator />
      <Text variant="bodyMedium" style={styles.centerText}>{t(label)}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  const { t } = useTranslation();

  return (
    <View style={styles.stateBox}>
      <Text variant="titleMedium" style={styles.stateTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t(title)}</Text>
      {description ? <Text style={styles.muted}>{t(description)}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.stateBox}>
      <Text variant="titleMedium" style={styles.error} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.72}>
        {t(message)}
      </Text>
      {onRetry ? <Button mode="contained-tonal" onPress={onRetry}>{t("Retry")}</Button> : null}
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonCircle} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "62%" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl, backgroundColor: "#ffffc9" },
  centerText: { textAlign: "center", lineHeight: 20, color: "#145c24", fontWeight: "800" },
  loadingLogoWrap: {
    width: 156,
    height: 156,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0d5a1d",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5
  },
  loadingLogo: { width: 142, height: 142, borderRadius: 22 },
  stateBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 8,
    gap: spacing.md,
    alignItems: "center"
  },
  stateTitle: { color: colors.ink, lineHeight: 22 },
  muted: { color: colors.cocoa, textAlign: "center" },
  error: { color: colors.danger, textAlign: "center" },
  skeletonCard: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: "#fff4df"
  },
  skeletonCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#eadcae" },
  skeletonLine: { height: 14, borderRadius: 4, backgroundColor: "#eadcae", width: "82%" }
});
