import { Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Text } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useSubscriptionStore } from "@/store/subscription.store";

export default function PaymentFailedScreen() {
  const payment = useSubscriptionStore((state) => state.lastPayment);
  const homeRoute = "/astrologer";

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/subscription-plan")}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Failed</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.failIcon}>
          <MaterialCommunityIcons name="close" size={42} color="#fff" />
        </View>
        <Text variant="headlineSmall" style={styles.title}>
          Payment Failed
        </Text>
        <Text style={styles.message}>
          {payment?.message || "We could not complete the payment. Please try again or choose a plan later."}
        </Text>
        <Button mode="contained" onPress={() => router.replace("/subscription-plan")}>
          Back to Plans
        </Button>
        <Button mode="outlined" onPress={() => router.replace(homeRoute)}>
          Go to Dashboard
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    maxWidth: 520,
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
    maxWidth: 520,
    alignSelf: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "center"
  },
  failIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center"
  },
  title: { color: colors.ink, textAlign: "center", fontWeight: "900" },
  message: { color: colors.cocoa, textAlign: "center", lineHeight: 21 }
});
