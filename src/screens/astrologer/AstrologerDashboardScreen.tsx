import { useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import { AstrologerBottomNav, AstrologerSideDrawer } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useAstrologers } from "@/hooks/useAstrologers";
import { useAuthStore } from "@/store/auth.store";
import { Astrologer } from "@/types/api";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const services: { label: string; icon: IconName; route?: string }[] = [
  { label: "Daily\nPredictions", icon: "weather-sunny" },
  { label: "Horoscope", icon: "zodiac-aries", route: "/astrologer/my-horoscope" },
  { label: "Compatibility", icon: "heart-multiple" },
  { label: "Kundali PDF", icon: "file-document-outline", route: "/kundali-pdf" },
  { label: "Match Making PDF", icon: "account-heart-outline", route: "/match-making-pdf" },
  { label: "Apsara Astro Profile", icon: "account-star-outline", route: "/apsara-astro-profile" },
  { label: "Today's\nMuhurta", icon: "calendar-star" },
  { label: "Today's\nPanchang", icon: "script-text" },
  { label: "Numeroscope", icon: "numeric", route: "/astrologer/numerology" },
  { label: "E-Pooja", icon: "home-heart" },
  { label: "Store", icon: "shopping" }
];

const fallbackExperts: Astrologer[] = [
  { displayName: "Mrinali", specialization: "Numerologist", pricePerMinute: 30, yearsOfExperience: 8 },
  { displayName: "Abhimanyu", specialization: "Astrologer", pricePerMinute: 40, yearsOfExperience: 10 },
  { displayName: "Deepak", specialization: "Vastu Expert", pricePerMinute: 50, yearsOfExperience: 12 },
  { displayName: "Ananya", specialization: "Tarot Reader", pricePerMinute: 35, yearsOfExperience: 7 },
  { displayName: "Rajesh", specialization: "Vedic Astrology", pricePerMinute: 45, yearsOfExperience: 12 },
  { displayName: "Kavita", specialization: "Palmistry", pricePerMinute: 30, yearsOfExperience: 6 }
];

export function AstrologerDashboardScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  const astrologers = useAstrologers();
  const isAuthLoaded = useAuthStore((state) => state.isAuthLoaded);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const roles = useAuthStore((state) => state.roles);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const name = useMemo(() => {
    const profile = user as { firstName?: string; displayName?: string; fullName?: string } | null;
    return profile?.displayName || profile?.fullName || profile?.firstName || "Ananya";
  }, [user]);
  const initials = useMemo(() => getUserInitials(user), [user]);
  const homeExperts = useMemo(() => {
    const data = astrologers.data?.length ? astrologers.data : fallbackExperts;
    return data.slice(0, 6);
  }, [astrologers.data]);

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!isLoggedIn) {
      router.replace({ pathname: "/(auth)/login", params: { mode: "astrologer" } });
      return;
    }
    if (!roles.includes("ROLE_ASTROLOGER")) {
      router.replace("/(drawer)/(tabs)");
    }
  }, [isAuthLoaded, isLoggedIn, roles]);

  if (!isAuthLoaded || !isLoggedIn || !roles.includes("ROLE_ASTROLOGER")) {
    return <LoadingState label="Opening login" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.phone}>
        <View style={styles.header}>
          <Pressable style={styles.iconTap} onPress={() => setDrawerOpen(true)}>
            <MaterialCommunityIcons name="menu" size={25} color={colors.ink} />
          </Pressable>
          <Image source={require("@/assets/logo_apsara.jpeg")} resizeMode="cover" style={styles.headerLogo} />
          <View style={styles.brandBlock}>
            <Text style={styles.logoText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
              Apsara Astro
            </Text>
            <Text style={styles.tagline} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>{t("ACCOUNT PREDICTIONS SACRED RITUALS ACCESSIBLE")}</Text>
          </View>
          <View style={styles.wallet}>
            <Text style={styles.walletText}>Rs. 50</Text>
            <MaterialCommunityIcons name="plus-circle" size={18} color={colors.success} />
          </View>
          <LanguageSelector />
          <Pressable style={styles.notificationTap}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.cocoa} />
          </Pressable>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Pressable style={styles.avatar} onPress={() => router.push("/astrologer/profile-me")}>
                <Text style={styles.avatarText}>{initials}</Text>
              </Pressable>
              <View style={styles.profileCopy}>
                <Text style={styles.welcome}>{t("Welcome Back")}</Text>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.profileHint}>{t("Manage consultations, reports, and client requests.")}</Text>
              </View>
            </View>
            <View style={styles.profileStats}>
              <StatPill label={t("Queue")} value="12" />
              <StatPill label={t("Reports")} value="08" />
              <StatPill label={t("Rating")} value="4.8" />
            </View>
          </View>

          <View style={styles.search}>
            <MaterialCommunityIcons name="magnify" size={18} color="#111" />
            <View style={styles.searchLine} />
            <MaterialCommunityIcons name="microphone-outline" size={18} color="#333" />
          </View>

          <SectionTitle title={t("Astrology Tools")} />
          <View style={styles.serviceGrid}>
            {services.map((service) => {
              const enabled = Boolean(service.route);
              return (
              <Pressable
                key={service.label}
                disabled={!enabled}
                onPress={service.route ? () => router.push(service.route as never) : undefined}
                style={[styles.serviceItem, !enabled && styles.serviceItemMuted]}
              >
                <View style={[styles.serviceCircle, enabled && styles.serviceCircleActive]}>
                  <MaterialCommunityIcons name={service.icon} size={24} color={enabled ? colors.amber : "#9d8d60"} />
                </View>
                <Text style={styles.serviceText} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.68}>
                  {t(service.label)}
                </Text>
              </Pressable>
              );
            })}
          </View>

          <View style={styles.chatBanner}>
            <ImageBackground source={require("@/assets/Astrosignup.jpg")} style={styles.bannerPhoto} imageStyle={styles.bannerPhotoImage} />
            <View style={styles.bannerCopy}>
              <Text style={styles.chatNow}>{t("CHAT\nNOW")}</Text>
            </View>
            <Text style={styles.claim}>{t("Claim Your\nFirst\nFree Chat")}</Text>
          </View>
          <Text style={styles.caption}>{t("Talk with any of our certified Astrologers, Numerologist, Palmist, Tarot Reader, Graphologist, Vastu Experts, Gem Stone Consultant")}</Text>

          <SectionTitle title={t("Top Astrologers & Numerologist")} action={t("View all")} onAction={() => router.push("/astrologers")} />
          <ExpertRow astrologers={homeExperts} />

          <View style={styles.pageTwo}>
            <Text style={styles.subhead}>{t("Gem stone & Pyrites")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gems}>
              {Array.from({ length: 7 }).map((_, index) => (
                <View key={index} style={styles.gemOuter}>
                  <View style={styles.gemInner} />
                </View>
              ))}
            </ScrollView>

            <Text style={styles.subhead}>{t("Apsra Astro Blogs")}</Text>
            <View style={styles.blogRow}>
              {[0, 1, 2].map((item) => <View key={item} style={styles.blogCard} />)}
            </View>

            <View style={styles.trustRow}>
              <TrustItem icon="account-check" label={t("Verified\nProfessionals")} />
              <TrustItem icon="lock-check" label={t("Confidential\nConsultation")} />
              <TrustItem icon="cash-lock" label={t("Seamless &\nSecure\nPayment")} />
            </View>
          </View>
        </ScrollView>

        <AstrologerBottomNav />
        <AstrologerSideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title, action, crown, onAction }: { title: string; action?: string; crown?: boolean; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.titleRow}>
        {crown ? <MaterialCommunityIcons name="crown" size={19} color="#d59a13" /> : null}
        <Text style={styles.sectionText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.viewAll}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getExpertName(astrologer: Astrologer) {
  return astrologer.displayName || astrologer.fullName || [astrologer.firstName, astrologer.lastName].filter(Boolean).join(" ") || "Apsara Expert";
}

function getUserInitials(user: unknown) {
  const profile = user as { firstName?: string; lastName?: string; displayName?: string; fullName?: string } | null;
  if (profile?.displayName?.trim()) {
    return profile.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  const firstInitial = profile?.firstName?.trim().charAt(0);
  const lastInitial = profile?.lastName?.trim().charAt(0);
  const initials = [firstInitial, lastInitial].filter(Boolean).join("");

  if (initials) return initials.toUpperCase();

  const name = profile?.fullName || profile?.displayName || "Apsara User";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function ExpertRow({ astrologers }: { astrologers: Astrologer[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.expertRow}>
      {astrologers.map((astrologer, index) => {
        const name = getExpertName(astrologer);
        return (
        <Pressable key={astrologer.publicId || astrologer.email || name} disabled style={styles.expertCard}>
          <Text style={styles.expertRole} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t(astrologer.specialization || "Astrologer")}</Text>
          <View style={styles.expertPhoto}>
            <MaterialCommunityIcons name="account-circle" size={58} color={index % 2 === 0 ? "#1a1a1a" : "#3b2517"} />
            <View style={styles.expertShade}>
              <Text style={styles.expertName} numberOfLines={1}>{name}</Text>
              <Text style={styles.price}>Rs. {astrologer.pricePerMinute || 30}/min</Text>
            </View>
          </View>
        </Pressable>
        );
      })}
    </View>
  );
}

function TrustItem({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustCircle}>
        <MaterialCommunityIcons name={icon} size={38} color="#111" />
      </View>
      <Text style={styles.trustText} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{label}</Text>
    </View>
  );
}

function NavItem({ icon, label, onPress }: { icon: IconName; label: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.navItem}>
      <MaterialCommunityIcons name={icon} size={30} color="#050505" />
      <Text style={styles.navText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  phone: { flex: 1, alignSelf: "center", width: "100%", maxWidth: 430, backgroundColor: colors.cream },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 96, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", minHeight: 62, gap: 5, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  iconTap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7df", borderWidth: 1, borderColor: colors.border },
  notificationTap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#fff7df", borderWidth: 1, borderColor: colors.border },
  headerLogo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.ink },
  brandBlock: { flex: 1, minWidth: 96 },
  logoText: { fontSize: 16, lineHeight: 20, fontWeight: "900", color: colors.ink },
  wallet: { minWidth: 62, borderWidth: 1, borderColor: "#d7eac8", borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 6, height: 32, backgroundColor: "#f8fff3" },
  walletText: { fontSize: 11, lineHeight: 13, color: colors.ink, fontWeight: "900" },
  tagline: { color: colors.amber, fontSize: 6, lineHeight: 8, fontWeight: "800" },
  profileCard: { marginTop: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.md },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  profileCopy: { flex: 1, minWidth: 0 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.gold, backgroundColor: "#fff8e5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: "900" },
  welcome: { fontSize: 13, color: colors.cocoa, fontWeight: "700" },
  name: { fontSize: 26, lineHeight: 31, color: colors.ink, fontWeight: "900" },
  profileHint: { marginTop: 2, color: colors.cocoa, fontSize: 12, lineHeight: 16 },
  profileStats: { flexDirection: "row", gap: spacing.sm },
  statPill: { flex: 1, minHeight: 54, borderRadius: 8, backgroundColor: "#fff7df", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  statValue: { color: colors.ink, fontSize: 17, lineHeight: 20, fontWeight: "900" },
  statLabel: { color: colors.cocoa, fontSize: 11, fontWeight: "700" },
  search: { height: 42, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md },
  searchLine: { flex: 1 },
  serviceGrid: {width: "100%", flexDirection: "row", flexWrap: "wrap",  rowGap: 10},
  serviceItem: { width: "31.5%",marginHorizontal: 3, minHeight: 56, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.md },
  serviceItemMuted: { opacity: 0.72 },
  serviceCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#fff4ce", borderColor: colors.border, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  serviceCircleActive: { borderColor: colors.gold, backgroundColor: "#fff0b8" },
  serviceText: { width: "100%", minHeight: 44, marginTop: spacing.sm, fontSize: 12, lineHeight: 22, textAlign: "center", fontWeight: "900", color: colors.ink, includeFontPadding: true },
  chatBanner: { height: 92, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden", flexDirection: "row", backgroundColor: "#ecf8e8" },
  bannerPhoto: { width: 114, height: "100%" },
  bannerPhotoImage: { resizeMode: "cover" },
  bannerCopy: { justifyContent: "center", alignItems: "center", width: 108 },
  chatNow: { fontFamily: "serif", fontSize: 29, lineHeight: 31, fontWeight: "900", color: "#111", textAlign: "center" },
  claim: { flex: 1, fontFamily: "serif", alignSelf: "center", textAlign: "center", fontSize: 18, lineHeight: 21, fontWeight: "900", color: "#111" },
  caption: { marginTop: 6, fontFamily: "serif", fontSize: 10, lineHeight: 14, color: "#111" },
  sectionTitle: { marginTop: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  titleRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  sectionText: { flex: 1, minWidth: 0, fontFamily: "serif", fontSize: 13, lineHeight: 16, fontWeight: "900", color: "#111" },
  viewAll: { fontFamily: "serif", fontSize: 12, color: "#777" },
  expertRow: {borderRadius :8, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  // expertCard: { width: "30.5%", backgroundColor: "#f8fff5" },
  expertCard: {
  width: "30.5%",
  backgroundColor: "#f8fff5",

  // Shadow (iOS)
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  // borderRadius: 8,

  // Shadow (Android)
  elevation: 4,
  // paddingBottom: 4,
},
  expertRole: { minHeight: 38, paddingHorizontal: 3, borderRadius:8, textAlign: "center", textAlignVertical: "center", fontSize: 10, lineHeight: 13, color: "#111" },
  expertPhoto: { height: 100, justifyContent: "flex-end", alignItems: "center", backgroundColor: "#e2f6df" },
  expertShade: { alignSelf: "stretch", minHeight: 42, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.28)", paddingHorizontal: 4 },
  expertName: { fontFamily: "serif", fontSize: 16, lineHeight: 19, color: "#fff", fontWeight: "900" },
  price: { fontSize: 10, color: "#fff",paddingBottom: 2 },
  pageTwo: { paddingTop: 22 },
  subhead: { marginTop: 8, marginBottom: 8, marginLeft: 0, fontFamily: "serif", fontSize: 13, lineHeight: 17, color: "#111", fontWeight: "700" },
  gems: { gap: 10, paddingHorizontal: 0},
  gemOuter: { width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: "#e5a700", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  gemInner: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#22160d", borderWidth: 5, borderColor: "#fff6e2" },
  blogRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  blogCard: { width: "30.5%", height: 126, borderRadius: 12, borderWidth: 4, borderColor: "#073b4a", backgroundColor: "#d5f4d7" },
  trustRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 48, marginBottom: 20 },
  trustItem: { width: "31%", alignItems: "center" },
  trustCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: "#3e9b35", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fff7" },
  trustText: { width: "100%", minHeight: 48, marginTop: 8, textAlign: "center", fontFamily: "serif", fontSize: 14, lineHeight: 16, color: "#111", fontWeight: "900" },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 66, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#efefef", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navItem: { width: "20%", alignItems: "center", justifyContent: "center", gap: 2 },
  navText: { width: "100%", minHeight: 22, textAlign: "center", fontSize: 9, lineHeight: 11, color: "#111" },
  drawerLayer: { ...StyleSheet.absoluteFillObject, flexDirection: "row" },
  drawerDim: { flex: 1, backgroundColor: "rgba(0,0,0,0.18)" },
  drawerPanel: { position: "absolute", left: 0, top: 0, bottom: 0, width: "82%", maxWidth: 330, backgroundColor: "#fff" },
  drawerContent: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 92 },
  drawerHead: { flexDirection: "row", alignItems: "center", marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#e9e0c4", paddingBottom: 14 },
  drawerAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#111", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  drawerTitle: { flex: 1, marginLeft: 13 },
  drawerName: { fontFamily: "serif", fontSize: 26, lineHeight: 29, color: "#111", fontWeight: "900" },
  phoneText: { fontSize: 13, color: "#111", marginTop: 2 },
  editBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f3edd7", alignItems: "center", justifyContent: "center" },
  closeBtn: { marginLeft: 13, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  drawerItem: { minHeight: 39, flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 8, paddingHorizontal: 8 },
  drawerItemDisabled: { opacity: 0.55 },
  drawerText: { fontSize: 13, color: "#111", fontWeight: "600" }
});
