import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import {
  getTrialInfo,
  isSubscriptionActive,
  SubscriptionRecord,
  useSubscriptionStore
} from "@/store/subscription.store";

type Props = {
  userPublicId: string;
  compact?: boolean;
};

export function SubscriptionStatusCard({ userPublicId, compact }: Props) {
  const trial = useSubscriptionStore((state) => state.trials[userPublicId]);
  const subscription = useSubscriptionStore((state) => state.subscriptions[userPublicId]);
  const trialInfo = getTrialInfo(trial);
  const active = isSubscriptionActive(subscription);

  if (active && subscription) {
    return <ActivePlanCard subscription={subscription} compact={compact} />;
  }

  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={() => router.push("/subscription-plan")}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="creation" size={22} color={colors.amber} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>
          {trialInfo.trialActive ? `${trialInfo.daysRemaining} Days Free Trial` : "Continue with a Subscription"}
        </Text>
        <Text style={styles.text}>
          {trialInfo.trialActive
            ? "Enjoy all available features during your free trial."
            : "Choose a plan to keep astrology, numerology, and tarot insights active."}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.cocoa} />
    </Pressable>
  );
}

function ActivePlanCard({ subscription, compact }: { subscription: SubscriptionRecord; compact?: boolean }) {
  return (
    <View style={[styles.card, styles.activeCard, compact && styles.compact]}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="crown" size={22} color={colors.success} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{subscription.planName}</Text>
        <Text style={styles.text}>
          Active Plan • {subscription.tenure}
          {subscription.expiryDate ? ` • Expires ${new Date(subscription.expiryDate).toLocaleDateString()}` : ""}
        </Text>
      </View>
      <Button compact mode="text" onPress={() => router.push("/subscription-plan")}>
        View
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  compact: { minHeight: 74, padding: spacing.sm },
  activeCard: { borderColor: "#b9dfbd", backgroundColor: "#f8fff5" },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff7df",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: colors.ink, fontSize: 16, lineHeight: 20, fontWeight: "900" },
  text: { color: colors.cocoa, fontSize: 12, lineHeight: 16 }
});
