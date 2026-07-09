import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, ProgressBar, Text } from "react-native-paper";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getAstrologerProfile } from "@/services/astrologer.service";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AstrologerProfileScreen() {
  const { t } = useTranslation();
  const profile = useQuery({ queryKey: ["astrologer-profile"], queryFn: getAstrologerProfile });

  if (profile.isLoading) return <LoadingState label="Loading profile" />;
  if (profile.isError) {
    return (
      <Screen>
        <ErrorState message="Unable to load astrologer profile" onRetry={() => profile.refetch()} />
      </Screen>
    );
  }

  const data = profile.data || {};
  const name =
    data.displayName ||
    data.fullName ||
    [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") ||
    t("Astrologer");
  const completion = Math.max(0, Math.min(100, data.profileCompletionPercentage || 0));

  const rows = [
    ["Email", data.email, "email"],
    ["Mobile", data.mobileNo || data.mobileNumber || data.phone, "phone"],
    ["Gender", data.gender, "gender-male-female"],
    ["Experience", data.yearsOfExperience ? `${data.yearsOfExperience} ${t("years")}` : undefined, "star-circle"],
    ["Specialization", data.specialization, "creation"],
    ["Languages", data.language || data.languagesKnown, "translate"],
    ["Address", data.address, "map-marker"],
    ["City", [data.city, data.state, data.pinCode].filter(Boolean).join(", "), "city"],
    ["Country", data.country, "earth"],
    ["Religion", data.religion, "temple-hindu"],
    ["Caste", data.caste, "account-group"],
    ["Gotra", data.gotra, "leaf"],
    ["Mother Tongue", data.motherTongue, "comment-text"],
    ["Joined", [data.dateOfJoining, data.timeOfJoining].filter(Boolean).join(` ${t("at")} `), "calendar-clock"]
  ] as const;

  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.content}>
          <View style={styles.header}>
            <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
            <Text variant="titleMedium" style={styles.headerTitle}>{t("Profile")}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <Avatar.Text size={82} label={initialsFromName(name) || "AA"} style={styles.avatar} labelStyle={styles.avatarLabel} />
            <View style={styles.heroCopy}>
              <Text variant="headlineSmall" style={styles.name}>{name}</Text>
              <Text style={styles.muted}>{t(data.specialization || "Astrology Expert")}</Text>
              <View style={styles.progressBlock}>
                <View style={styles.progressTop}>
                  <Text style={styles.progressLabel}>{t("Profile completion")}</Text>
                  <Text style={styles.progressValue}>{completion}%</Text>
                </View>
                <ProgressBar progress={completion / 100} color={colors.success} style={styles.progress} />
              </View>
            </View>
          </View>

          {data.bio ? (
            <View style={styles.bioCard}>
              <Text variant="titleMedium">{t("About")}</Text>
              <Text style={styles.bio}>{data.bio}</Text>
            </View>
          ) : null}

          <View style={styles.grid}>
            {rows.map(([label, value, icon]) => value ? (
              <View key={label} style={styles.infoCard}>
                <MaterialCommunityIcons name={icon} size={22} color={colors.ink} />
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>{t(label)}</Text>
                  <Text style={styles.infoValue}>{t(String(value))}</Text>
                </View>
              </View>
            ) : null)}
          </View>
            </View>
      </Screen>
      <AstrologerBottomNav active="profile" respectSafeArea />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 96, gap: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontWeight: "800", color: colors.ink },
  headerSpacer: { width: 70 },
  hero: { flexDirection: "row", gap: spacing.md, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime, fontWeight: "800" },
  heroCopy: { flex: 1, gap: spacing.xs },
  name: { fontWeight: "900", color: colors.ink },
  muted: { color: colors.cocoa, lineHeight: 20 },
  progressBlock: { marginTop: spacing.sm, gap: spacing.xs },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: colors.cocoa, fontSize: 12 },
  progressValue: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  progress: { height: 8, borderRadius: 8, backgroundColor: "#efe5bf" },
  bioCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm },
  bio: { color: colors.ink, lineHeight: 22 },
  grid: { gap: spacing.sm },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fffdf6", padding: spacing.md },
  infoCopy: { flex: 1, gap: 2 },
  infoLabel: { color: colors.cocoa, fontSize: 12, fontWeight: "700" },
  infoValue: { color: colors.ink, lineHeight: 20, fontWeight: "600" }
});
