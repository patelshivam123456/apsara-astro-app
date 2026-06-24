import { Image, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View style={styles.center}>
      <Image source={require("@/assets/logo_apsara.jpeg")} resizeMode="contain" style={styles.loadingLogo} />
      <ActivityIndicator />
      <Text variant="bodyMedium">{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.stateBox}>
      <Text variant="titleMedium">{title}</Text>
      {description ? <Text style={styles.muted}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateBox}>
      <Text variant="titleMedium" style={styles.error}>
        {message}
      </Text>
      {onRetry ? <Button mode="contained-tonal" onPress={onRetry}>Retry</Button> : null}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  loadingLogo: { width: 150, height: 150, borderRadius: 20 },
  stateBox: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: 8,
    gap: spacing.md,
    alignItems: "center"
  },
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
