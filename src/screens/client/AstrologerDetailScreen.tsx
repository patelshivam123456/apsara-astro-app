import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Avatar, Button, Chip, Text } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { Screen } from "@/components/Screen";
import { EmptyState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getAstrologerById } from "@/services/astrologer.service";
import { Astrologer } from "@/types/api";

type DetailRow = {
  label: string;
  value?: string | number | null;
};

function splitValues(value?: string | string[]) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return (value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function getName(astro: Astrologer, fallback: string) {
  return astro.displayName || astro.fullName || [astro.firstName, astro.middleName, astro.lastName].filter(Boolean).join(" ") || fallback;
}

function joinValues(values: Array<string | number | undefined | null>) {
  return values.filter((value) => value !== undefined && value !== null && String(value).trim()).join(", ");
}

function compactRows(rows: DetailRow[]) {
  return rows.filter((row) => row.value !== undefined && row.value !== null && String(row.value).trim());
}

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
  const name = getName(astro, t("Apsara Expert"));
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const languages = splitValues(astro.language || astro.languagesKnown);
  const expertise = splitValues(astro.expertise);
  const modes = splitValues(astro.consultationModes);
  const location = joinValues([astro.city, astro.state, astro.country]);
  const bio = astro.bio || astro.aboutYourself || t("View astrologer details, experience, languages, and consultation options.");
  const profileRows = compactRows([
    { label: "Full Name", value: name },
    { label: "Specialization", value: astro.specialization },
    { label: "Expertise", value: expertise.join(", ") },
    { label: "Experience", value: `${astro.yearsOfExperience || 5}+ ${t("years")}` },
    { label: "Profile Status", value: astro.profileStatus },
    { label: "Profile Completion", value: astro.profileCompletionPercentage ? `${astro.profileCompletionPercentage}%` : undefined }
  ]);
  const contactRows = compactRows([
    { label: "Email", value: astro.email },
    { label: "Phone", value: astro.phone || astro.mobileNo || astro.mobileNumber },
    { label: "Location", value: location },
    { label: "Address", value: astro.address },
    { label: "Pin Code", value: astro.pinCode }
  ]);
  const backgroundRows = compactRows([
    { label: "Gender", value: astro.gender },
    { label: "Date of Birth", value: astro.dateOfBirth },
    { label: "Religion", value: astro.religion },
    { label: "Mother Tongue", value: astro.motherTongue },
    { label: "Caste", value: astro.caste },
    { label: "Gotra", value: astro.gotra },
    { label: "Education", value: astro.educationalQualification },
    { label: "Joining Date", value: astro.dateOfJoining },
    { label: "Joining Time", value: astro.timeOfJoining }
  ]);
  const documentRows = compactRows([
    { label: "Aadhaar Document", value: astro.aadhaarFileUuid ? "Uploaded" : undefined },
    { label: "Education Document", value: astro.educationalQualificationFileUuid ? "Uploaded" : undefined },
    { label: "Experience Document", value: astro.experienceFileUuid ? "Uploaded" : undefined },
    { label: "Clients", value: astro.clients?.length ? `${astro.clients.length}` : undefined }
  ]);

  return (
    <View style={styles.root}>
      <Screen>
        <View style={styles.content}>
          <View style={styles.header}>
            <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>{t("Back")}</Button>
            <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Astrologer")}</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Avatar.Text label={initials || "AA"} size={92} style={styles.avatar} labelStyle={styles.avatarLabel} />
                <View style={[styles.statusDot, { backgroundColor: astro.isOnline === false ? "#9a9a9a" : colors.success }]} />
              </View>
              <View style={styles.heroInfo}>
                <Text variant="headlineSmall" style={styles.name} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.76}>{name}</Text>
                <Text style={styles.muted} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.72}>{t(astro.specialization || "Astrology")} • {astro.yearsOfExperience || 5}+ {t("years")}</Text>
                <View style={styles.heroChips}>
                  <Chip compact icon="currency-inr" style={styles.priceChip} textStyle={styles.priceText}>₹{astro.pricePerMinute || 25}/min</Chip>
                  <Chip compact icon={astro.isOnline === false ? "clock-outline" : "check-circle"} style={styles.onlineChip} textStyle={styles.onlineText}>
                    {t(astro.isOnline === false ? "Offline" : "Online")}
                  </Chip>
                </View>
              </View>
            </View>
            <Text style={styles.bio}>{bio}</Text>
            <View style={styles.actions}>
              <Button mode="outlined" icon="chat" style={styles.actionButton} contentStyle={styles.actionContent} disabled>{t("Chat")}</Button>
              <Button mode="contained" icon="phone" style={styles.actionButton} contentStyle={styles.actionContent} disabled>{t("Call")}</Button>
            </View>
          </View>
          <PillSection title="Languages" fallback="Hindi, English" values={languages} />
          <PillSection title="Expertise" fallback="Astrology" values={expertise.length ? expertise : splitValues(astro.specialization)} />
          <PillSection title="Consultation Modes" fallback="Chat, Call" values={modes} />
          <DetailSection title="Profile Details" icon="account-star" rows={profileRows} />
          <DetailSection title="Contact & Location" icon="map-marker-radius" rows={contactRows} />
          <DetailSection title="Background" icon="school" rows={backgroundRows} />
          <DetailSection title="Documents" icon="file-check" rows={documentRows} />
        </View>
      </Screen>
      <AstrologerBottomNav active="home" respectSafeArea />
    </View>
  );
}

function PillSection({ fallback, title, values }: { fallback: string; title: string; values: string[] }) {
  const { t } = useTranslation();
  const items = values.length ? values : splitValues(fallback);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(title)}</Text>
      <View style={styles.chips}>
        {items.map((item) => (
          <Chip key={`${title}-${item}`} compact style={styles.detailChip} textStyle={styles.detailChipText}>
            {t(item)}
          </Chip>
        ))}
      </View>
    </View>
  );
}

function DetailSection({ icon, rows, title }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; rows: DetailRow[]; title: string }) {
  const { t } = useTranslation();
  if (!rows.length) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.amber} />
        <Text style={styles.sectionTitle}>{t(title)}</Text>
      </View>
      <View style={styles.detailRows}>
        {rows.map((row) => (
          <View key={`${title}-${row.label}`} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t(row.label)}</Text>
            <Text style={styles.detailValue}>{String(row.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 100, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, fontSize: 19, fontWeight: "900", color: colors.ink, textAlign: "center", lineHeight: 24 },
  headerSpacer: { width: 70 },
  hero: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#6b5309",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  heroTop: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  heroInfo: { flex: 1, minWidth: 0, gap: spacing.sm },
  avatar: { backgroundColor: colors.ink },
  avatarLabel: { color: colors.lime, fontWeight: "900" },
  statusDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.surface
  },
  name: { color: colors.ink, fontWeight: "900", lineHeight: 31 },
  muted: { color: colors.cocoa, fontWeight: "700", lineHeight: 20 },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  priceChip: { backgroundColor: "#e8ddf8" },
  priceText: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  onlineChip: { backgroundColor: "#f2ffe9" },
  onlineText: { color: colors.success, fontSize: 12, fontWeight: "900" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  bio: { color: colors.cocoa, fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: "row", gap: spacing.md },
  actionButton: { flex: 1, borderRadius: 28 },
  actionContent: { minHeight: 44 },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  sectionTitle: { color: colors.ink, fontSize: 15, lineHeight: 19, fontWeight: "900" },
  detailChip: { backgroundColor: "#fffbd8", borderWidth: 1, borderColor: colors.border },
  detailChipText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  detailRows: { borderTopWidth: 1, borderTopColor: colors.border },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm
  },
  detailLabel: { flex: 0.82, color: colors.cocoa, fontSize: 12, lineHeight: 17, fontWeight: "800" },
  detailValue: { flex: 1.18, color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800", textAlign: "right" }
});
