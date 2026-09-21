import { useEffect, useMemo, useState } from "react";
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Badge, Button, IconButton, Text } from "react-native-paper";

import { AstrologerCard } from "@/components/AstrologerCard";
import {
  AstrologerFilterModal,
  AstrologerFilterState,
  defaultAstrologerFilters,
  filterAstrologers,
  getActiveAstrologerFilterCount,
  getAstrologerFilterOptions,
  getAstrologerRouteId
} from "@/components/AstrologerFilters";
import { LanguageSelector } from "@/components/LanguageSelector";
import { EmptyState, ErrorState, SkeletonRow } from "@/components/StateViews";
import { ServiceTile } from "@/components/ServiceTile";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useAstrologers } from "@/hooks/useAstrologers";
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore } from "@/store/wallet.store";
import { getUserPublicId } from "@/utils/user";

const quickServices = [
  ["Horoscope", "om"],
  ["Daily Predictions", "weather-sunset"],
  ["Horoscope Compatibility", "hand-heart"],
  ["Kundali", "script-text"],
  ["Match Making PDF", "account-heart-outline"],
  ["Apsra Astro Profile", "account-star-outline"],
  ["Muhurta", "calendar-star"],
  ["Today's Panchang", "calendar-month"],
  ["Numeroscope", "numeric-9-plus-circle"],
  ["E-Pooja", "hands-pray"]
] as const;

export function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userPublicId = getUserPublicId(user, accessToken);
  const balance = useWalletStore((state) => state.balance);
  const astrologers = useAstrologers();
  const [refreshing, setRefreshing] = useState(false);
  const [comingSoonService, setComingSoonService] = useState("");
  const [filters, setFilters] = useState<AstrologerFilterState>(defaultAstrologerFilters);
  const [filterVisible, setFilterVisible] = useState(false);
  const displayName = useMemo(() => {
    const profile = user as { firstName?: string; displayName?: string } | null;
    return profile?.firstName || profile?.displayName || "User";
  }, [user]);
  const astrologerData = astrologers.data || [];
  const filterOptions = useMemo(() => getAstrologerFilterOptions(astrologerData), [astrologerData]);
  const filteredAstrologers = useMemo(() => filterAstrologers(astrologerData, filters), [astrologerData, filters]);
  const activeFilterCount = getActiveAstrologerFilterCount(filters);

  const refresh = async () => {
    setRefreshing(true);
    await astrologers.refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!comingSoonService) return;
    const timeout = setTimeout(() => setComingSoonService(""), 1200);
    return () => clearTimeout(timeout);
  }, [comingSoonService]);

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
          <Text variant="headlineSmall" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <LanguageSelector />
          <Button mode="contained-tonal" icon="wallet" onPress={() => router.push("/wallet")}>₹{balance}</Button>
        </View>
      </View>

      <View style={styles.services}>
        {quickServices.map(([title, icon]) => (
          <ServiceTile
            key={title}
            title={title}
            icon={icon}
            notice={comingSoonService === title ? "Coming Soon" : undefined}
            onPress={() => {
              if (title === "Horoscope") {
                router.push("/my-horoscope");
                return;
              }
              if (title === "Kundali") {
                router.push("/kundali-pdf");
                return;
              }
              if (title === "Match Making PDF") {
                router.push("/match-making-pdf");
                return;
              }
              if (title === "Apsra Astro Profile") {
                router.push("/apsara-astro-profile");
                return;
              }
              if (title === "Muhurta" || title === "Today's Panchang") {
                setComingSoonService(title);
                return;
              }
              router.push(`/feature/${encodeURIComponent(title)}`);
            }}
          />
        ))}
      </View>

      {userPublicId ? <SubscriptionStatusCard userPublicId={userPublicId} /> : null}

      <ImageBackground source={require("@/assets/Astro_Banner.jpg")} style={styles.banner} imageStyle={styles.bannerImage}>
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerCopy}>
          <Text variant="headlineSmall" style={styles.bannerTitle} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Claim Your First Free Chat")}</Text>
          <Text style={styles.bannerText}>{t("Start with a verified expert and continue when it feels right.")}</Text>
          <Button mode="contained" buttonColor={colors.lime} textColor={colors.ink} onPress={() => router.push("/chat")}>{t("Chat Now")}</Button>
        </View>
      </ImageBackground>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitleText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Top Astrologers & Numerologist")}</Text>
        <View style={styles.sectionActions}>
          <View style={styles.filterIconWrap}>
            <IconButton icon="tune-variant" mode="contained-tonal" size={20} onPress={() => setFilterVisible(true)} />
            {activeFilterCount ? <Badge style={styles.filterBadge}>{activeFilterCount}</Badge> : null}
          </View>
          <Button mode="text" compact onPress={() => router.push("/astrologers")}>{t("View all")}</Button>
        </View>
      </View>
      {astrologers.isLoading ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : astrologers.isError ? (
        <ErrorState message="Unable to load astrologers" onRetry={() => astrologers.refetch()} />
      ) : filteredAstrologers.length ? (
        filteredAstrologers.slice(0, 4).map((astrologer) => (
          <AstrologerCard
            key={astrologer.publicId || astrologer.email}
            astrologer={astrologer}
            onChat={() => router.push("/chat")}
            onCall={() => router.push("/call")}
            onView={() => {
              const routeId = getAstrologerRouteId(astrologer);
              if (routeId) router.push(`/astrologers/${routeId}`);
            }}
          />
        ))
      ) : (
        <EmptyState title="No astrologers available" description="Please check again soon." />
      )}

      <View style={styles.band}>
        <Text variant="titleLarge" style={styles.blockTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Store")}</Text>
        <View style={styles.pillRow}>
          {["Gemstones", "Pyrites", "Spiritual Products"].map((item) => (
            <View key={item} style={styles.pill}><Text style={styles.pillText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t(item)}</Text></View>
          ))}
        </View>
      </View>

      <View style={styles.band}>
        <Text variant="titleLarge" style={styles.blockTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Apsra Astro Blogs")}</Text>
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
            <Text style={styles.trustText} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>{t(label)}</Text>
          </View>
        ))}
      </View>
      <AstrologerFilterModal
        filters={filters}
        onChange={setFilters}
        onClose={() => setFilterVisible(false)}
        options={filterOptions}
        visible={filterVisible}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 0 },
  muted: { color: colors.cocoa },
  services: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
  banner: { minHeight: 178, overflow: "hidden", borderRadius: 8, justifyContent: "flex-end" },
  bannerImage: { borderRadius: 8 },
  bannerOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(33,23,4,0.42)" },
  bannerCopy: { padding: spacing.lg, gap: spacing.sm, alignItems: "flex-start" },
  bannerTitle: { color: colors.surface, fontWeight: "800", lineHeight: 30 },
  bannerText: { color: colors.cream, lineHeight: 21 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  sectionTitleText: { flex: 1, minWidth: 0 },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 0 },
  filterIconWrap: { alignItems: "center", justifyContent: "center" },
  filterBadge: { position: "absolute", top: 2, right: 1, backgroundColor: colors.danger },
  band: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  blockTitle: { lineHeight: 28 },
  pill: { maxWidth: "100%", minHeight: 40, borderRadius: 8, backgroundColor: "#fff4df", borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: "center" },
  pillText: { color: colors.ink, lineHeight: 17 },
  trust: { flexDirection: "row", gap: spacing.sm },
  trustItem: { flex: 1, minHeight: 106, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: spacing.sm, alignItems: "center" },
  trustText: { width: "100%", minHeight: 42, textAlign: "center", fontSize: 12, lineHeight: 14, color: colors.ink }
});
