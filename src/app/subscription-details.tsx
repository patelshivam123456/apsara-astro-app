import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";

import { ApiSubscriptionStatusCard, getActivePlanName } from "@/components/ApiSubscriptionStatusCard";
import { subscriptionPlanDetails, SubscriptionPlanId } from "@/constants/subscription";
import { colors, spacing } from "@/constants/theme";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useAuthStore } from "@/store/auth.store";
import { getUserPublicId } from "@/utils/user";

export default function SubscriptionDetailsScreen() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);
  const userPublicId = getUserPublicId(user, token);
  const { data, isPending, isError, refetch } = useSubscriptionAccess(userPublicId);
  const plan = data?.plan;


  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => router.canGoBack() ? router.back() : router.replace("/subscription-plan")}>Back</Button>
        <Text variant="titleLarge">Plan Details</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {isPending ? <Text>Loading plan details…</Text> : isError ? (
          <><Text>Unable to load plan details.</Text><Button onPress={() => void refetch()}>Retry</Button></>
        ) : <>
          {data?.kind === "active" && plan
            ? <PlanDetails plan={plan} active />
            : <ApiSubscriptionStatusCard userPublicId={userPublicId} />}
          {data?.expiredPlans.length ? <>
            <Text variant="titleLarge">Expired Plans</Text>
            {data.expiredPlans.map((expired, index) => (
              <PlanDetails key={String(expired.subscriptionId ?? expired.transactionId ?? index)} plan={expired} />
            ))}
          </> : null}
        </>}

      </ScrollView>
    </SafeAreaView>
  );
}

function PlanDetails({ plan, active = false }: { plan: Record<string, unknown>; active?: boolean }) {
  const catalog = typeof plan.planId === "string" ? subscriptionPlanDetails[plan.planId as SubscriptionPlanId] : undefined;
  const rows: [string, unknown][] = [
    ["Plan ID", plan.planId],
    ["Description", plan.planDescription],
    ["Amount", typeof plan.amount === "number" ? `${plan.currency ?? "INR"} ${plan.amount.toLocaleString("en-IN")}` : plan.amount],
    ["Tenure", plan.subscriptionTenure ?? plan.tenure],
    ["Start Date", plan.subscriptionStartDate ?? displayDate(plan.startDate)],
    ["Expiry Date", plan.subscriptionEndDate ?? displayDate(plan.expiresAt ?? plan.expiryDate)],
    ["Subscription ID", plan.subscriptionId],
    ["Subscription Status", plan.subscriptionStatus ?? (active ? "ACTIVE" : "EXPIRED")],
    ["Payment Status", plan.paymentStatus],
    ["Payment Mode", plan.paymentMode],
    ["Payment Completion Date", plan.paymentCompletionDate],
    ["Transaction ID", plan.transactionId],
    ["Order ID", plan.razorpayOrderId],
    ["Payment ID", plan.razorpayPaymentId]
  ];
  return <View style={styles.card}>
    <Text variant="headlineSmall">{getActivePlanName(plan)}</Text>
    <Text style={active ? styles.active : styles.label}>{active ? "Active Plan" : "Expired Plan"}</Text>
    {rows.filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => (
      <View key={label} style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{String(value)}</Text>
      </View>
    ))}
    {catalog ? <>
      {catalog.features.map((feature) => <Text key={feature}>✓ {feature}</Text>)}
    </> : null}
  </View>;
}

function displayDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  active: { color: colors.success, fontWeight: "800" },
  row: { flexDirection: "row", gap: spacing.md, justifyContent: "space-between" },
  label: { flex: 1, color: colors.cocoa },
  value: { flex: 1, color: colors.ink, textAlign: "right" }
});
