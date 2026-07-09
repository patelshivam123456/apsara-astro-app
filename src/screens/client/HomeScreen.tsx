import { useMemo, useState } from "react";
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text } from "react-native-paper";

import { AstrologerCard } from "@/components/AstrologerCard";
import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState, ErrorState, SkeletonRow } from "@/components/StateViews";
import { ServiceTile } from "@/components/ServiceTile";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useAstrologers } from "@/hooks/useAstrologers";
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore } from "@/store/wallet.store";

const quickServices = [
  ["Daily Predictions", "weather-sunset"],
  ["Horoscope Compatibility", "heart-multiple"],
  ["Today's Muhurta", "calendar-star"],
  ["Panchang", "calendar-month"],
  ["Numeroscope", "numeric"],
  ["E-Pooja", "hands-pray"]
] as const;

export function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const balance = useWalletStore((state) => state.balance);
  const astrologers = useAstrologers();
  const [refreshing, setRefreshing] = useState(false);
  const displayName = useMemo(() => {
    const profile = user as { firstName?: string; displayName?: string } | null;
    return profile?.firstName || profile?.displayName || "User";
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await astrologers.refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text variant="labelLarge" style={styles.muted}>{t("Welcome")}</Text>
          <Text variant="headlineSmall">{displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <LanguageSelector />
          <Button mode="contained-tonal" icon="wallet" onPress={() => router.push("/wallet")}>₹{balance}</Button>
        </View>
      </View>

      <View style={styles.services}>
        {quickServices.map(([title, icon]) => (
          <ServiceTile key={title} title={title} icon={icon} onPress={() => router.push(`/feature/${encodeURIComponent(title)}`)} />
        ))}
      </View>

      <ImageBackground source={require("@/assets/Astro_Banner.jpg")} style={styles.banner} imageStyle={styles.bannerImage}>
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerCopy}>
          <Text variant="headlineSmall" style={styles.bannerTitle}>{t("Claim Your First Free Chat")}</Text>
          <Text style={styles.bannerText}>{t("Start with a verified expert and continue when it feels right.")}</Text>
          <Button mode="contained" buttonColor={colors.lime} textColor={colors.ink} onPress={() => router.push("/chat")}>{t("Chat Now")}</Button>
        </View>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge">{t("Top Astrologers")}</Text>
        <Button mode="text" onPress={() => router.push("/astrologers")}>{t("View all")}</Button>
      </View>
      {astrologers.isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : astrologers.isError ? (
        <ErrorState message="Unable to load astrologers" onRetry={() => astrologers.refetch()} />
      ) : astrologers.data?.length ? (
        astrologers.data.slice(0, 4).map((astrologer) => (
          <AstrologerCard
            key={astrologer.publicId || astrologer.email}
            astrologer={astrologer}
            onChat={() => router.push("/chat")}
            onCall={() => router.push("/call")}
            onView={() => router.push(`/astrologers/${astrologer.publicId}`)}
          />
        ))
      ) : (
        <EmptyState title="No astrologers available" description="Please check again soon." />
      )}

      <View style={styles.band}>
        <Text variant="titleLarge">{t("Store")}</Text>
        <View style={styles.pillRow}>
          {["Gemstones", "Pyrites", "Spiritual Products"].map((item) => (
            <View key={item} style={styles.pill}><Text>{t(item)}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.band}>
        <Text variant="titleLarge">{t("Apsara Astro Blogs")}</Text>
        <Text style={styles.muted}>{t("Daily guidance, rituals, compatibility, and numerology insights.")}</Text>
      </View>

      <View style={styles.trust}>
        {[
          ["Verified Professionals", "account-check"],
          ["Confidential Consultation", "shield-lock"],
          ["Secure Payments", "credit-card-lock"]
        ].map(([label, icon]) => (
          <View key={label} style={styles.trustItem}>
            <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={colors.amber} />
            <Text style={styles.trustText}>{t(label)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  muted: { color: colors.cocoa },
  services: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  banner: { minHeight: 178, overflow: "hidden", borderRadius: 8, justifyContent: "flex-end" },
  bannerImage: { borderRadius: 8 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(33,23,4,0.42)" },
  bannerCopy: { padding: spacing.lg, gap: spacing.sm, alignItems: "flex-start" },
  bannerTitle: { color: colors.surface, fontWeight: "800" },
  bannerText: { color: colors.cream, lineHeight: 21 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  band: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  pill: { borderRadius: 8, backgroundColor: "#fff4df", borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  trust: { flexDirection: "row", gap: spacing.sm },
  trustItem: { flex: 1, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: spacing.sm, alignItems: "center" },
  trustText: { textAlign: "center", fontSize: 12, color: colors.ink }
});
