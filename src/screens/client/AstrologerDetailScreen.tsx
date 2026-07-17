import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Avatar, Button, Chip, Text } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getAstrologerById } from "@/services/astrologer.service";

export function AstrologerDetailScreen() {
  const { t } = useTranslation();
  const { publicId = "" } = useLocalSearchParams<{ publicId?: string }>();
  const query = useQuery({
    queryKey: ["astrologer", publicId],
    queryFn: () => getAstrologerById(publicId),
    enabled: !!publicId
  });

  if (query.isLoading) return <LoadingState label="Loading profile" />;
  if (!query.data) return <Screen><EmptyState title="Astrologer not found" /></Screen>;

  const astro = query.data;
  const name = astro.displayName || astro.fullName || [astro.firstName, astro.lastName].filter(Boolean).join(" ") || t("Apsara Expert");
  const initials = name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.content}>
          <View style={styles.header}>
            <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
            <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Astrologer")}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.card}>
            <Avatar.Text label={initials || "AA"} size={86} style={styles.avatar} labelStyle={styles.avatarLabel} />
            <Text variant="headlineSmall" style={styles.name} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.76}>{name}</Text>
            <Text style={styles.muted} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t(astro.specialization || "Astrology")} • {astro.yearsOfExperience || 5}+ {t("years")}</Text>
            <View style={styles.chips}>
              {(String(astro.language || astro.languagesKnown || "Hindi, English").split(",")).map((item) => (
                <Chip key={item.trim()} compact>{item.trim()}</Chip>
              ))}
            </View>
            <Text style={styles.bio}>{astro.bio || astro.aboutYourself || t("View astrologer details, experience, languages, and consultation options.")}</Text>
            <View style={styles.actions}>
              <Button mode="outlined" icon="chat" onPress={() => router.push("/chat")}>{t("Chat")}</Button>
              <Button mode="contained" icon="phone" onPress={() => router.push("/call")}>{t("Call")}</Button>
            </View>
          </View>
        </View>
      </Screen>
      <AstrologerBottomNav active="home" respectSafeArea />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 96, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, fontWeight: "800", color: colors.ink, textAlign: "center", lineHeight: 22 },
  headerSpacer: { width: 70 },
  card: { alignItems: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 8, padding: spacing.xl, gap: spacing.md },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime },
  name: { color: colors.ink, textAlign: "center", lineHeight: 31 },
  muted: { color: colors.cocoa, textAlign: "center", lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  bio: { color: colors.cocoa, textAlign: "center", lineHeight: 22 },
  actions: { flexDirection: "row", gap: spacing.md }
});
