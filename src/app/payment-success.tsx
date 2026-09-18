import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";

export default function PaymentSuccessScreen() {
  const roles = useAuthStore((state) => state.roles);
  const payment = useSubscriptionStore((state) => state.lastPayment);
  const subscription = payment?.subscription;
  const homeRoute = roles.includes("ROLE_ASTROLOGER") ? "/astrologer" : "/(drawer)/(tabs)";

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/subscription-plan")}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Success</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.successIcon}>
          <MaterialCommunityIcons name="check" size={42} color="#fff" />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Payment Successful
        </Text>
        <Text style={styles.subtitle}>Subscription Activated</Text>

        {subscription ? (
          <View style={styles.summary}>
            <InfoRow label="Plan Name" value={subscription.planName} />
            <InfoRow label="Plan ID" value={subscription.planId} />
            <InfoRow label="Amount" value={`₹${subscription.amount.toLocaleString("en-IN")}`} />
            <InfoRow label="Subscription Tenure" value={subscription.tenure} />
            <InfoRow label="Start Date" value={formatDate(subscription.startDate)} />
            <InfoRow label="Expiry Date" value={subscription.expiryDate ? formatDate(subscription.expiryDate) : "Not available"} />
            <InfoRow label="Current Status" value={subscription.status} />
          </View>
        ) : (
          <Text style={styles.muted}>Your subscription details will appear here after refresh.</Text>
        )}

        <Button mode="contained" onPress={() => router.replace(homeRoute)}>
          Go to Dashboard
        </Button>
        <Button mode="outlined" onPress={() => router.replace("/subscription-plan")}>
          View My Subscription
        </Button>
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: { flex: 1, color: colors.ink, textAlign: "center", fontSize: 18, lineHeight: 23, fontWeight: "900" },
  headerSpacer: { width: 40 },
  card: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "center"
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center"
  },
  title: { color: colors.ink, textAlign: "center", fontWeight: "900" },
  subtitle: { color: colors.cocoa, textAlign: "center", fontSize: 16, lineHeight: 22, fontWeight: "800" },
  muted: { color: colors.cocoa, textAlign: "center", lineHeight: 20 },
  summary: {
    alignSelf: "stretch",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8dff7",
    backgroundColor: "#fbf8ff",
    padding: spacing.md,
    gap: spacing.sm
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  label: { flex: 1, color: colors.cocoa },
  value: { flex: 1, color: colors.ink, fontWeight: "800", textAlign: "right" }
});
