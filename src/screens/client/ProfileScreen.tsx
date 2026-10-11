import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, ProgressBar, Snackbar, Switch, Text, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useClientProfile, useUpdateClientProfile } from "@/hooks/useProfile";
import { getApiErrorMessage } from "@/services/apiClient";
import { useAuthStore } from "@/store/auth.store";
import { ClientProfile } from "@/types/api";
import { getUserPublicId } from "@/utils/user";

type FieldKey = keyof ClientProfile;

const editableKeys: FieldKey[] = [
  "firstName",
  "middleName",
  "lastName",
  "mobileNo",
  "gender",
  "dateOfBirth",
  "timeOfBirth",
  "placeOfBirth",
  "countryOfBirth",
  "address",
  "city",
  "state",
  "pinCode",
  "country",
  "religion",
  "caste",
  "gotra",
  "motherTongue",
  "language",
  "fatherName",
  "motherName",
  "spouseName",
  "spouseRelationship",
  "childName"
];

function asText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function fullName(profile: ClientProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ") || "Apsra User";
}

function initialFromName(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const signOut = useAuthStore((state) => state.signOut);
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useClientProfile();
  const update = useUpdateClientProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ClientProfile>({});
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile.data) setForm(profile.data);
  }, [profile.data]);

  const data = form;
  const name = fullName(data);
  const userPublicId = getUserPublicId(authUser || data, accessToken);
  const completion = useMemo(() => {
    const completed = editableKeys.filter((key) => asText(data[key]).trim()).length + (data.email ? 1 : 0);
    const total = editableKeys.length + 1;
    return { completed, total, percent: Math.round((completed / total) * 100) };
  }, [data]);

  const setField = (key: FieldKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const submitUpdate = async () => {
    if (data.dateOfBirth && parseDate(data.dateOfBirth) > new Date()) {
      setError(t("Date of birth cannot be in the future."));
      return;
    }

    try {
      setError("");
      await update.mutateAsync(data);
      await profile.refetch();
      setEditing(false);
      setMessage(t("Profile updated successfully."));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update profile"));
    }
  };

  if (profile.isLoading) return <LoadingState label="Loading profile" />;
  if (profile.isError) {
    return (
      <SafeAreaView style={styles.root}>
        <ErrorState message="Unable to load profile" onRetry={() => profile.refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.fixedHeaderSafe}>
        <View style={styles.header}>
          <Button mode="text" icon="arrow-left" compact onPress={() => router.replace("/astrologer")}>
            {t("Back")}
          </Button>
          <Text style={styles.headerTitle}>{t("Profile & Settings")}</Text>
          <View style={styles.headerActions}>
            <LanguageSelector />
            <Pressable
              onPress={() => setEditing((value) => !value)}
              style={[styles.roundAction, editing && styles.roundActionActive]}
            >
              <MaterialCommunityIcons name={editing ? "close" : "pencil"} size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: editing ? 132 + insets.bottom : 96 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* <View style={styles.hero}>
            <Text style={styles.kicker}>{t("Account Center")}</Text>
            <Text style={styles.heroTitle}>{t("Profile & Settings")}</Text>
            <Text style={styles.heroText}>
              {t("Keep your personal, birth, contact, and family details ready for faster, more accurate guidance.")}
            </Text>
          </View> */}

          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initialFromName(name)}</Text></View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileName}>{name}</Text>
                <Text style={styles.profileHint}>{t("Keep your birth, contact, and family details complete for a sharper consultation experience.")}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              {/* <Button mode="contained" icon="pencil" compact onPress={() => setEditing(true)} style={styles.editButton} labelStyle={styles.editButtonText}>
                {t("Edit Profile")}
              </Button> */}
              <Button mode="outlined" icon="lock-reset" compact onPress={() => router.push("/change-password")} style={styles.passwordButton} labelStyle={styles.passwordButtonText}>
                {t("Change Password")}
              </Button>
              <View style={styles.progressCard}>
                <Text style={styles.progressPercent}>{completion.percent}%</Text>
              <Text style={styles.progressLabel}>{t("Complete")}</Text>
              </View>
            </View>
            {userPublicId ? <SubscriptionStatusCard userPublicId={userPublicId} compact /> : null}
            {/* <View style={styles.progressCard}>
              <Text style={styles.progressPercent}>{completion.percent}%</Text>
              <Text style={styles.progressLabel}>{t("Complete")}</Text>
              <ProgressBar progress={completion.percent / 100} color={colors.lime} style={styles.progress} />
              <Text style={styles.progressDetail}>
                {completion.completed} {t("of")} {completion.total} {t("key fields complete")}
              </Text>
              <Text style={styles.progressHint}>{t("Add missing details to raise your profile score and improve personalization.")}</Text>
            </View> */}
          </View>

          <Section title="Personal Details" subtitle="Primary identity and contact information for your account.">
            <ProfileInput label="First Name" value={data.firstName || ""} editable={editing} onChangeText={(value) => setField("firstName", value)} />
            <ProfileInput label="Middle Name" value={data.middleName || ""} editable={editing} onChangeText={(value) => setField("middleName", value)} />
            <ProfileInput label="Last Name" value={data.lastName || ""} editable={editing} onChangeText={(value) => setField("lastName", value)} />
            <ProfileInput label="Email" value={data.email || ""} editable={false} />
            <ProfileInput label="Mobile" value={data.mobileNo || data.phone || ""} editable={editing} onChangeText={(value) => setField("mobileNo", value)} />
            <ProfileInput label="Gender" value={data.gender || ""} editable={editing} translateValue onChangeText={(value) => setField("gender", value)} />
          </Section>

          <Section title="Birth Profile" subtitle="Astrology-ready details used for more accurate guidance.">
            <DateField label="Date of Birth" value={data.dateOfBirth || ""} editable={editing} onPress={() => setShowDobPicker(true)} />
            <ProfileInput label="Time of Birth" value={data.timeOfBirth || ""} editable={editing} onChangeText={(value) => setField("timeOfBirth", value)} />
            <ProfileInput label="Place of Birth" value={data.placeOfBirth || ""} editable={editing} onChangeText={(value) => setField("placeOfBirth", value)} />
            <ProfileInput label="Country of Birth" value={data.countryOfBirth || ""} editable={editing} translateValue onChangeText={(value) => setField("countryOfBirth", value)} />
          </Section>

          <Section title="Location Details" subtitle="Current address and regional profile information.">
            <ProfileInput label="Address" value={data.address || ""} editable={editing} multiline onChangeText={(value) => setField("address", value)} />
            <ProfileInput label="City" value={data.city || ""} editable={editing} onChangeText={(value) => setField("city", value)} />
            <ProfileInput label="State" value={data.state || ""} editable={editing} onChangeText={(value) => setField("state", value)} />
            <ProfileInput label="Pin Code" value={data.pinCode || ""} editable={editing} onChangeText={(value) => setField("pinCode", value)} />
            <ProfileInput label="Country" value={data.country || ""} editable={editing} translateValue onChangeText={(value) => setField("country", value)} />
          </Section>

          <Section title="Family And Culture" subtitle="Personal context that helps tailor recommendations.">
            <ProfileInput label="Religion" value={data.religion || ""} editable={editing} translateValue onChangeText={(value) => setField("religion", value)} />
            <ProfileInput label="Caste" value={data.caste || ""} editable={editing} onChangeText={(value) => setField("caste", value)} />
            <ProfileInput label="Gotra" value={data.gotra || ""} editable={editing} onChangeText={(value) => setField("gotra", value)} />
            <ProfileInput label="Mother Tongue" value={data.motherTongue || ""} editable={editing} translateValue onChangeText={(value) => setField("motherTongue", value)} />
            <ProfileInput label="Language" value={data.language || ""} editable={editing} translateValue onChangeText={(value) => setField("language", value)} />
            <ProfileInput label="Father Name" value={data.fatherName || ""} editable={editing} onChangeText={(value) => setField("fatherName", value)} />
            <ProfileInput label="Mother Name" value={data.motherName || ""} editable={editing} onChangeText={(value) => setField("motherName", value)} />
            <ProfileInput label="Spouse Name" value={data.spouseName || ""} editable={editing} onChangeText={(value) => setField("spouseName", value)} />
            <ProfileInput label="Spouse Relationship" value={data.spouseRelationship || ""} editable={editing} onChangeText={(value) => setField("spouseRelationship", value)} />
            <ProfileInput label="Child Name" value={data.childName || ""} editable={editing} onChangeText={(value) => setField("childName", value)} />
          </Section>

          <Section title="Preferences" subtitle="Control how Apsra Astro keeps you updated.">
            <PreferenceRow label="Push Notifications" value />
            <PreferenceRow label="Email Updates" value={false} />
          </Section>

          <View style={styles.accountActions}>
            <Text style={styles.sectionTitle}>{t("Account Actions")}</Text>
            <Text style={styles.dangerText}>{t("Logout clears your session on this device.")}</Text>
            <Button mode="outlined" icon="logout" onPress={handleLogout} style={styles.logoutButton} labelStyle={styles.logoutButtonText}>
              {t("Logout")}
            </Button>
          </View>

          {showDobPicker ? (
            <DateTimePicker
              value={parseDate(data.dateOfBirth)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                if (Platform.OS !== "ios") setShowDobPicker(false);
                if (selectedDate) setField("dateOfBirth", toDateInput(selectedDate));
              }}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {editing ? (
        <View style={[styles.updateBar, { bottom: 56 + insets.bottom }]}>
          <Text style={styles.updateHint}>{t("Edit profile details and save your changes.")}</Text>
          <Button
            mode="contained"
            icon="content-save"
            loading={update.isPending}
            disabled={update.isPending}
            onPress={submitUpdate}
            style={styles.updateButton}
            labelStyle={styles.updateButtonText}
          >
            {t("Update Profile")}
          </Button>
        </View>
      ) : null}

      <AstrologerBottomNav active="profile" respectSafeArea />
      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3000}>{message}</Snackbar>
      <Snackbar visible={!!error} onDismiss={() => setError("")} duration={4500} style={styles.errorSnack}>{error}</Snackbar>
    </View>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t(title)}</Text>
      <Text style={styles.sectionSub}>{t(subtitle)}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function ProfileInput({
  label,
  value,
  editable,
  multiline,
  translateValue,
  onChangeText
}: {
  label: string;
  value: string;
  editable: boolean;
  multiline?: boolean;
  translateValue?: boolean;
  onChangeText?: (value: string) => void;
}) {
  const { t } = useTranslation();
  const displayValue = editable ? value : value ? (translateValue ? t(value) : value) : t("Not added");
  return (
    <TextInput
      label={t(label)}
      value={displayValue}
      editable={editable}
      disabled={!editable}
      onChangeText={onChangeText}
      mode="outlined"
      dense
      multiline={multiline}
      style={[styles.input, multiline && styles.multilineInput]}
      outlineStyle={styles.inputOutline}
      contentStyle={styles.inputContent}
      theme={{ colors: { background: "#fffdf8", primary: colors.amber, outline: colors.border } }}
    />
  );
}

function DateField({ label, value, editable, onPress }: { label: string; value: string; editable: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable disabled={!editable} onPress={onPress}>
      <TextInput
        label={t(label)}
        value={value || t("Not added")}
        editable={false}
        disabled={!editable}
        mode="outlined"
        dense
        right={editable ? <TextInput.Icon icon="calendar" onPress={onPress} /> : undefined}
        style={styles.input}
        outlineStyle={styles.inputOutline}
        contentStyle={styles.inputContent}
        theme={{ colors: { background: "#fffdf8", primary: colors.amber, outline: colors.border } }}
      />
    </Pressable>
  );
}

function PreferenceRow({ label, value }: { label: string; value: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{t(label)}</Text>
      <Switch value={value} disabled />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  fixedHeaderSafe: { backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: "#f0dfae", zIndex: 40 },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, color: colors.blue, fontSize: 16, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, zIndex: 45 },
  roundAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffad43", alignItems: "center", justifyContent: "center" },
  roundActionActive: { backgroundColor: "#f7e2b6" },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  hero: { borderRadius: 18, borderWidth: 1, borderColor: "#ead27a", backgroundColor: "#fff7e0", padding: spacing.lg, gap: spacing.sm },
  kicker: { alignSelf: "flex-start", color: "#f28b3d", borderWidth: 1, borderColor: "#ffdca6", borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: 5, fontSize: 10, lineHeight: 12, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { color: colors.ink, fontSize: 26, lineHeight: 32, fontWeight: "900" },
  heroText: { color: colors.blue, fontSize: 13, lineHeight: 20, fontWeight: "700" },
  profileCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.ink, borderWidth: 4, borderColor: colors.lime, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.lime, fontSize: 20, lineHeight: 24, fontWeight: "900" },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: "900" },
  profileHint: { color: colors.cocoa, marginTop: 4, fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: "row",justifyContent: "space-between", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  editButton: { borderRadius: 18, backgroundColor: "#f28b3d" },
  editButtonText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  passwordButton: { borderRadius: 18, borderColor: "#e3c472" },
  passwordButtonText: { color: colors.amber, fontSize: 12, fontWeight: "900" },
  progressCard: { alignItems: "center", backgroundColor: "#fff6d8", borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.lg, gap: spacing.xs, borderRadius:100 },
  progressPercent: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "900" },
  progressLabel: { color: colors.cocoa, fontSize: 8, lineHeight: 12, fontWeight: "900", textTransform: "uppercase" },
  progress: { width: "78%", height: 8, borderRadius: 8, backgroundColor: "#eadcae", marginVertical: spacing.xs },
  progressDetail: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: "900" },
  progressHint: { color: colors.cocoa, textAlign: "center", fontSize: 11, lineHeight: 16 },
  section: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 16, lineHeight: 20, fontWeight: "900" },
  sectionSub: { color: colors.cocoa, marginTop: 3, fontSize: 12, lineHeight: 16 },
  sectionBody: { marginTop: spacing.md, gap: spacing.sm },
  input: { backgroundColor: "#fffdf8", minHeight: 50 },
  multilineInput: { minHeight: 92 },
  inputOutline: { borderRadius: 10, borderColor: "#f0dfae" },
  inputContent: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  preferenceRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, borderColor: "#f0dfae", backgroundColor: "#fffdf8", paddingHorizontal: spacing.md },
  preferenceLabel: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" },
  accountActions: { borderRadius: 12, borderWidth: 1, borderColor: "#f4bdc0", backgroundColor: "#fff1f2", padding: spacing.md, gap: spacing.sm },
  dangerText: { color: colors.danger, fontSize: 12, lineHeight: 17 },
  logoutButton: { borderRadius: 18, borderColor: colors.danger },
  logoutButtonText: { color: colors.danger, fontWeight: "900" },
  updateBar: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#fffaf0", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, zIndex: 30 },
  updateHint: { color: colors.cocoa, fontSize: 12, lineHeight: 16 },
  updateButton: { borderRadius: 8, backgroundColor: colors.amber },
  updateButtonText: { color: "#fff", fontWeight: "900" },
  errorSnack: { backgroundColor: colors.danger }
});
