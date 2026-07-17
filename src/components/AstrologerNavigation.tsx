import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useAuthStore } from "@/store/auth.store";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const drawerItems: [string, IconName, boolean, () => void][] = [
  ["Home", "home", true, () => router.replace("/astrologer")],
  ["My Horoscope", "zodiac-aries", true, () => router.push("/astrologer/my-horoscope")],
  ["Numerology", "numeric", true, () => router.push("/astrologer/numerology")],
  ["Tarot Reading", "cards", false, () => {}],
  ["Vastu Consultation", "home-city", false, () => {}],
  ["Consultation with Palmist", "hand-front-right", false, () => {}],
  ["Consultation with Graphologist", "pencil", false, () => {}],
  ["Gift Card", "gift", false, () => {}],
  ["Wallet transaction History", "wallet-outline", false, () => {}],
  ["Order History", "clipboard-list", false, () => {}],
  ["Remedy", "flower", false, () => {}],
  ["Store", "shopping", false, () => {}],
  ["Customer Care", "headset", false, () => {}],
  ["Setting", "cog", false, () => {}]
];

export function AstrologerSideDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { t } = useTranslation();
  const name = useMemo(() => {
    const profile = user as { firstName?: string; displayName?: string; fullName?: string } | null;
    return profile?.displayName || profile?.fullName || profile?.firstName || "Ananya";
  }, [user]);
  const mobile = useMemo(() => {
    const profile = user as { mobileNo?: string; mobileNumber?: string; phone?: string } | null;
    return profile?.mobileNo || profile?.mobileNumber || profile?.phone || "1231231236";
  }, [user]);
  const initial = name.trim().charAt(0).toUpperCase() || "A";

  const openProfile = () => {
    onClose();
    router.push("/astrologer/profile-me");
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    router.replace({ pathname: "/(auth)/login", params: { mode: "astrologer" } });
  };

  if (!visible) return null;

  return (
    <View style={styles.drawerLayer}>
      <Pressable style={styles.drawerDim} onPress={onClose} />
      <View style={styles.drawerPanel}>
        <ScrollView
          contentContainerStyle={styles.drawerContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.drawerHead}>
            <Pressable style={styles.drawerAvatar} onPress={openProfile}>
              <Text style={styles.drawerAvatarText}>{initial}</Text>
            </Pressable>
            <Pressable style={styles.drawerTitle} onPress={openProfile}>
              <Text style={styles.drawerName}>{name}</Text>
              <Text style={styles.phoneText}>+91 {mobile}</Text>
            </Pressable>
            <Pressable onPress={openProfile} style={styles.editBtn}>
              <MaterialCommunityIcons name="pencil" size={18} color="#111" />
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#111" />
            </Pressable>
          </View>
          {drawerItems.map(([label, icon, enabled, action]) => (
            <Pressable
              key={label}
              disabled={!enabled}
              onPress={() => {
                onClose();
                action();
              }}
              style={[styles.drawerItem, !enabled && styles.drawerItemDisabled]}
            >
              <MaterialCommunityIcons name={icon} size={21} color="#111" />
              <Text style={styles.drawerText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>{t(label)}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.drawerItem} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={21} color="#111" />
            <Text style={styles.drawerText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.76}>{t("Logout")}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

type BottomNavProps = {
  active?: "home" | "chat" | "call" | "remedy" | "profile";
  respectSafeArea?: boolean;
};

export function AstrologerBottomNav({ active = "home", respectSafeArea = false }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = respectSafeArea ? insets.bottom : 0;
  const { t } = useTranslation();

  return (
    <View style={[styles.bottomNav, { height: 56 + bottomInset, paddingBottom: bottomInset }]}>
      <NavItem icon="home" label={t("Home")} active={active === "home"} onPress={() => router.replace("/astrologer")} />
      <NavItem icon="chat" label={t("Chat")} active={active === "chat"} />
      <NavItem icon="phone" label={t("Call")} active={active === "call"} />
      <NavItem icon="flower" label={t("Remedy")} active={active === "remedy"} />
      <NavItem icon="account" label={t("Profile")} active={active === "profile"} onPress={() => router.push("/astrologer/profile-me")} />
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: IconName; label: string; active?: boolean; onPress?: () => void }) {
  const color = active ? colors.amber : colors.cocoa;

  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.navItem}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.navText, active && styles.navTextActive]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  drawerLayer: { ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 60 },
  drawerDim: { flex: 1, backgroundColor: "rgba(0,0,0,0.18)" },
  drawerPanel: { position: "absolute", left: 0, top: 0, bottom: 0, width: "82%", maxWidth: 330, backgroundColor: "#fff" },
  drawerContent: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 100 },
  drawerHead: { flexDirection: "row", alignItems: "center", marginBottom: 14, borderBottomWidth: 1, borderBottomColor: "#e9e0c4", paddingBottom: 14 },
  drawerAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: "#111", backgroundColor: "#fff4c6", alignItems: "center", justifyContent: "center" },
  drawerAvatarText: { color: "#111", fontSize: 30, lineHeight: 34, fontWeight: "900" },
  drawerTitle: { flex: 1, minWidth: 0, marginLeft: 13 },
  drawerName: { fontFamily: "serif", fontSize: 26, lineHeight: 29, color: "#111", fontWeight: "900" },
  phoneText: { fontSize: 13, color: "#111", marginTop: 2 },
  editBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#f3edd7", alignItems: "center", justifyContent: "center" },
  closeBtn: { marginLeft: 8, width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  drawerItem: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 8, paddingHorizontal: 8 },
  drawerItemDisabled: { opacity: 0.55 },
  drawerText: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 16, color: "#111", fontWeight: "600" },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 64, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#efefef", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  navItem: { width: "20%", minHeight: 56, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 2 },
  navText: { width: "100%", minHeight: 28, textAlign: "center", fontSize: 11, lineHeight: 13, color: colors.cocoa, fontWeight: "700" },
  navTextActive: { color: colors.amber, fontWeight: "900" }
});
