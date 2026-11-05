import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";

export function ApiSubscriptionStatusCard({ userPublicId, compact, onUpgrade }: {
  userPublicId: string;
  compact?: boolean;
  onUpgrade?: () => void;
}) {
  const { data, isPending, isError, refetch } = useSubscriptionAccess(userPublicId);
  const upgrade = onUpgrade ?? (() => router.push("/subscription-plan"));
  return (
    <View style={[styles.card, !isPending && !isError && data?.kind === "active" && styles.activeCard, compact && { padding: spacing.sm }]}>
      {isPending ? <Text>Loading subscription…</Text> : isError ? (
        <>
          <Text>Unable to load your subscription.</Text>
          <Button onPress={() => void refetch()}>Retry</Button>
        </>
      ) : data?.kind === "trial" ? (
        <>
          <Text style={styles.title}>Free Trial · {data.daysRemaining} {data.daysRemaining === 1 ? "day" : "days"} remaining</Text>
          <Text style={styles.text}>Enjoy all available features during your free trial.</Text>
          <Button mode="outlined" onPress={upgrade}>Upgrade Plan</Button>
        </>
      ) : data?.kind === "active" ? (
        <>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>Your membership</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
          <View style={styles.planHeader}>
            <View style={styles.crown}>
              <MaterialCommunityIcons name="crown" size={25} color="#936315" />
            </View>
            <View style={styles.planCopy}>
              <Text style={styles.planTitle}>{getActivePlanName(data.plan)}</Text>
              <Text style={styles.tenure}>{String(data.plan?.subscriptionTenure ?? data.plan?.tenure ?? "Active subscription")}</Text>
            </View>
            {data.plan?.amount !== undefined && data.plan.amount !== null ? (
              <Text style={styles.price}>{typeof data.plan.amount === "number"
                ? `${data.plan.currency === "INR" || !data.plan.currency ? "₹" : `${data.plan.currency} `}${data.plan.amount.toLocaleString("en-IN")}`
                : String(data.plan.amount)}</Text>
            ) : null}
          </View>
          <View style={styles.dateRange}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>{formatBadgeValue(data.plan?.subscriptionStartDate ?? data.plan?.startDate)}</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#a38d65" />
            <View style={[styles.dateColumn, styles.dateEnd]}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>{formatBadgeValue(data.plan?.subscriptionEndDate ?? data.plan?.expiresAt ?? data.plan?.expiryDate)}</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button compact mode="contained" buttonColor="#76551d" textColor="#fff" style={styles.action} labelStyle={styles.actionLabel} onPress={() => router.push("/subscription-details")}>View Plan Details</Button>
            <Button compact textColor="#76551d" style={styles.action} labelStyle={styles.actionLabel} onPress={() => router.push("/subscription-plan")}>Subscription Plan</Button>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>You have no active plan</Text>
          <Text style={styles.text}>Continue with a Subscription</Text>
          <Button mode="outlined" onPress={upgrade}>Choose a Plan</Button>
          {data?.expiredPlans.length ? <Button onPress={() => router.push("/subscription-details")}>View Plan Details</Button> : null}
        </>
      )}
    </View>
  );
}

export function getActivePlanName(plan: Record<string, unknown> | null) {
  const name = plan?.planName ?? plan?.name ?? plan?.planId ?? plan?.plan;
  return typeof name === "string" && name ? name : "Your subscription is active";
}

function formatBadgeValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "Not available";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("en-IN");
  }
  return String(value);
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.ink, fontSize: 17, fontWeight: "900" },
  text: { color: colors.cocoa, lineHeight: 20 },
  activeCard: { borderRadius: 16, borderColor: "#e5cf9c", backgroundColor: "#fffbf1", gap: spacing.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  planHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  crown: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#f7e8c5", alignItems: "center", justifyContent: "center" },
  planCopy: { flex: 1, minWidth: 110, gap: 3 },
  planTitle: { color: colors.ink, fontSize: 19, fontWeight: "800" },
  tenure: { color: colors.cocoa, fontSize: 12 },
  price: { color: "#76551d", fontSize: 22, fontWeight: "800" },
  eyebrow: { color: "#936315", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#eaf5e9" },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
  statusText: { color: colors.success, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  dateRange: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#eee2c8", paddingVertical: 12 },
  dateColumn: { flex: 1, minWidth: 90, gap: 4 },
  dateEnd: { alignItems: "flex-end" },
  dateLabel: { color: "#947f5a", fontSize: 11, fontWeight: "600" },
  dateValue: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { borderRadius: 10, flexGrow: 1 },
  actionLabel: { fontSize: 12 }
});
