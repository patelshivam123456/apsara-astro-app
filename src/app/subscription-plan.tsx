import { useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import {
  orderedSubscriptionPlanIds,
  subscriptionPlanDetails,
  SubscriptionPlanId,
  subscriptionPlans
} from "@/constants/subscription";
import {
  acknowledgeSubscriptionPayment,
  createPaymentInitiatePayload,
  ensureRazorpayCheckoutAvailable,
  getPaymentErrorMessage,
  initiateSubscriptionPayment,
  openRazorpayCheckout
} from "@/services/subscription.service";
import { useAuthStore } from "@/store/auth.store";
import {
  buildSubscriptionRecord,
  canSelectPlan,
  getTrialInfo,
  isSubscriptionActive,
  useSubscriptionStore
} from "@/store/subscription.store";
import { getUserContact, getUserDisplayName, getUserPublicId } from "@/utils/user";

export default function SubscriptionPlanScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const roles = useAuthStore((state) => state.roles);
  const userPublicId = getUserPublicId(user, accessToken);
  const trial = useSubscriptionStore((state) => state.trials[userPublicId]);
  const subscription = useSubscriptionStore((state) => state.subscriptions[userPublicId]);
  const setActiveSubscription = useSubscriptionStore((state) => state.setActiveSubscription);
  const setLastPayment = useSubscriptionStore((state) => state.setLastPayment);
  const [loadingPlanId, setLoadingPlanId] = useState<SubscriptionPlanId | null>(null);
  const isWide = width >= 820;
  const isTablet = width >= 600;
  const columnWidth = isWide ? "23.5%" : isTablet ? "48%" : "100%";
  const trialInfo = getTrialInfo(trial);
  const active = isSubscriptionActive(subscription);
  const title = active ? "My Subscription" : "Choose Your Subscription Plan";
  const homeRoute = roles.includes("ROLE_ASTROLOGER") ? "/astrologer" : "/(drawer)/(tabs)";
  const subtitle = active
    ? "Your active plan is shown below. Renewal or upgrade opens within 10 days of expiry."
    : "Unlock astrology, numerology, tarot, and personalized reports with one simple plan.";

  const userPrefill = useMemo(
    () => ({
      name: getUserDisplayName(user),
      email: user?.email || "",
      contact: getUserContact(user)
    }),
    [user]
  );

  const handlePayNow = async (planId: SubscriptionPlanId) => {
    if (!userPublicId || loadingPlanId) return;

    setLoadingPlanId(planId);
    const planDetail = subscriptionPlanDetails[planId];

    try {
      ensureRazorpayCheckoutAvailable();
      const payload = createPaymentInitiatePayload(userPublicId, planId);
      console.log("[subscription.payment-initiate]", {
        userPublicId: payload.userPublicId,
        planId: payload.planId,
        amount: payload.amount,
        subscriptionTenure: payload.subscriptionTenure
      });
      const initiateResult = await initiateSubscriptionPayment(payload);
      const checkoutResponse = await openRazorpayCheckout({
        keyId: initiateResult.keyId,
        amount: initiateResult.amount,
        currency: initiateResult.currency,
        razorpayOrderId: initiateResult.razorpayOrderId,
        planName: planDetail.name,
        description: payload.planDescription,
        user: userPrefill
      });

      const razorpayOrderId = checkoutResponse.razorpay_order_id || initiateResult.razorpayOrderId;
      const razorpayPaymentId = checkoutResponse.razorpay_payment_id || "";
      const razorpaySignature = checkoutResponse.razorpay_signature || "";

      if (!razorpayPaymentId || !razorpaySignature) {
        throw new Error("Razorpay did not return complete payment details.");
      }

      await acknowledgeSubscriptionPayment({
        transactionId: initiateResult.transactionId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentMode: "online"
      });

      const record = buildSubscriptionRecord({
        userPublicId,
        planId,
        transactionId: initiateResult.transactionId
      });
      setActiveSubscription(record);
      router.replace("/payment-success");
    } catch (error) {
      const message = getPaymentErrorMessage(error);
      setLastPayment({ status: "failed", message });
      router.replace("/payment-failed");
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace(homeRoute)}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Subscription Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>Apsra Astro Premium</Text>
          <Text variant="headlineMedium" style={styles.heroTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>
            {title}
          </Text>
          <Text style={styles.heroText}>{subtitle}</Text>
        </View>
        <View style={styles.heroBadge}>
          <MaterialCommunityIcons name="zodiac-scorpio" size={46} color={colors.amber} />
        </View>
      </View>

      {!active && trialInfo.trialActive ? (
        <View style={styles.trialCard}>
          <MaterialCommunityIcons name="creation" size={24} color={colors.amber} />
          <View style={styles.flex}>
            <Text style={styles.trialTitle}>{trialInfo.daysRemaining} Days Free Trial</Text>
            <Text style={styles.muted}>Enjoy all available features during your free trial.</Text>
          </View>
        </View>
      ) : null}

      {active && subscription ? (
        <View style={styles.activePlan}>
          <View style={styles.activeHeader}>
            <MaterialCommunityIcons name="crown" size={26} color={colors.success} />
            <View style={styles.flex}>
              <Text style={styles.activeTitle}>Active Plan</Text>
              <Text style={styles.muted}>Status: {subscription.status}</Text>
            </View>
          </View>
          <InfoRow label="Plan Name" value={subscription.planName} />
          <InfoRow label="Plan ID" value={subscription.planId} />
          <InfoRow label="Subscription Tenure" value={subscription.tenure} />
          <InfoRow label="Start Date" value={formatDate(subscription.startDate)} />
          <InfoRow label="Expiry Date" value={subscription.expiryDate ? formatDate(subscription.expiryDate) : "Not available"} />
        </View>
      ) : null}

      <View style={styles.planGrid}>
        {orderedSubscriptionPlanIds.map((planId) => {
          const plan = subscriptionPlans[planId];
          const detail = subscriptionPlanDetails[planId];
          const action = canSelectPlan(subscription, planId);
          const isPopular = planId === "AST-POPULAR-B68";
          const disabled = !userPublicId || !action.allowed || Boolean(loadingPlanId);

          return (
            <View
              key={planId}
              style={[
                styles.planCard,
                { width: columnWidth },
                isPopular && styles.popularCard,
                planId === "AST-VALUE-C73" && styles.valueCard
              ]}
            >
              {detail.badge ? (
                <View style={[styles.badge, planId === "AST-VALUE-C73" && styles.valueBadge]}>
                  <Text style={styles.badgeText}>{detail.badge}</Text>
                </View>
              ) : null}
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={detail.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={30}
                  color={planId === "AST-VALUE-C73" ? "#a26a00" : "#5b1fc5"}
                />
              </View>
              <Text style={styles.planName}>{detail.name}</Text>
              <Text style={styles.tenure}>{plan.tenure}</Text>
              <Text style={styles.price}>₹{plan.amount.toLocaleString("en-IN")}</Text>
              <Text style={styles.perMonth}>{monthlyLabel(plan.amount, plan.tenure)}</Text>
              <View style={styles.divider} />
              <View style={styles.featureList}>
                {detail.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <MaterialCommunityIcons name="check" size={18} color={planId === "AST-VALUE-C73" ? "#a26a00" : "#4e21ad"} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              {!action.allowed ? <Text style={styles.disabledReason}>{action.reason}</Text> : null}
              <Button
                mode={isPopular ? "contained" : "outlined"}
                disabled={disabled}
                loading={loadingPlanId === planId}
                onPress={() => handlePayNow(planId)}
                style={styles.payButton}
              >
                Pay Now
              </Button>
            </View>
          );
        })}
      </View>

      <View style={styles.trustRow}>
        <TrustItem icon="shield-check" label="Trusted by 1,00,000+ Users" />
        <TrustItem icon="flower" label="Expert Verified Astrologers" />
        <TrustItem icon="lock-check" label="100% Secure Payments" />
        <TrustItem icon="headset" label="Dedicated Support" />
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function TrustItem({ icon, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }) {
  return (
    <View style={styles.trustItem}>
      <MaterialCommunityIcons name={icon} size={26} color={colors.amber} />
      <Text style={styles.trustText}>{label}</Text>
    </View>
  );
}

function monthlyLabel(amount: number, tenure: string) {
  const months = Number(tenure.match(/^\d+/)?.[0] || 1);
  return `₹${Math.round(amount / months).toLocaleString("en-IN")} / month`;
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
  hero: {
    minHeight: 172,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ead8ff",
    backgroundColor: "#fbf5ff",
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
    overflow: "hidden"
  },
  heroCopy: { flex: 1, minWidth: 0, gap: spacing.sm },
  kicker: { color: "#5b1fc5", fontWeight: "900", letterSpacing: 0 },
  heroTitle: { color: colors.ink, fontWeight: "900", lineHeight: 36 },
  heroText: { maxWidth: 620, color: colors.cocoa, lineHeight: 21 },
  heroBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#fff7df",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  trialCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center"
  },
  trialTitle: { fontSize: 17, lineHeight: 22, fontWeight: "900", color: colors.ink },
  flex: { flex: 1, minWidth: 0 },
  muted: { color: colors.cocoa, lineHeight: 20 },
  activePlan: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cfe8c9",
    backgroundColor: "#f8fff5",
    padding: spacing.lg,
    gap: spacing.sm
  },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  activeTitle: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, paddingVertical: 4 },
  infoLabel: { color: colors.cocoa, flex: 1 },
  infoValue: { color: colors.ink, fontWeight: "800", flex: 1, textAlign: "right" },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, alignItems: "stretch" },
  planCard: {
    minWidth: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ded7ec",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm
  },
  popularCard: { borderWidth: 2, borderColor: "#6c25d8", backgroundColor: "#fbf8ff" },
  valueCard: { borderColor: "#e3bb65", backgroundColor: "#fffaf0" },
  badge: {
    alignSelf: "center",
    marginTop: -28,
    borderRadius: 16,
    backgroundColor: "#6c25d8",
    paddingHorizontal: spacing.lg,
    paddingVertical: 5
  },
  valueBadge: { backgroundColor: "#d59113" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  iconCircle: {
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#f0e9ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm
  },
  planName: { textAlign: "center", color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: "900" },
  tenure: { textAlign: "center", color: colors.cocoa, fontWeight: "700" },
  price: { textAlign: "center", color: "#1e1153", fontSize: 30, lineHeight: 36, fontWeight: "900" },
  perMonth: { textAlign: "center", color: colors.cocoa, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#eee4fa", marginVertical: spacing.sm },
  featureList: { gap: spacing.sm, minHeight: 116 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 18 },
  disabledReason: { minHeight: 34, color: colors.danger, fontSize: 12, lineHeight: 16 },
  payButton: { marginTop: "auto", borderRadius: 8 },
  trustRow: {
    borderRadius: 8,
    backgroundColor: "#f8f2ff",
    borderWidth: 1,
    borderColor: "#ead8ff",
    padding: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  trustItem: { flexGrow: 1, flexBasis: 150, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  trustText: { flex: 1, color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "800" }
});
