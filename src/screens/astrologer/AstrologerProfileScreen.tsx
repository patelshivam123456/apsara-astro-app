import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Checkbox, Chip, ProgressBar, Snackbar, Switch, Text, TextInput } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AstrologerBottomNav } from "@/components/AstrologerNavigation";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import {
  getAstrologerProfile,
  getDownloadFileRequest,
  updateAstrologerProfile
} from "@/services/astrologer.service";
import { getApiErrorMessage } from "@/services/apiClient";
import { Astrologer } from "@/types/api";

type DocumentTab = "aadhaar" | "certificate" | "education" | "experience";
type FormState = Astrologer;

const documentTabs: { key: DocumentTab; label: string; fileType: string }[] = [
  { key: "aadhaar", label: "Aadhaar File", fileType: "aadhaar" },
  { key: "certificate", label: "Certificate File", fileType: "certificate" },
  { key: "education", label: "Education Qualification", fileType: "educationalQualification" },
  { key: "experience", label: "Experience File", fileType: "experience" }
];

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function asText(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function asList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function makeForm(profile: Astrologer): FormState {
  return {
    ...profile,
    expertise: asList(profile.expertise),
    languagesKnown: asList(profile.languagesKnown || profile.language),
    consultationModes: asList(profile.consultationModes)
  };
}

function getProfileName(data: Astrologer) {
  return (
    data.displayName ||
    data.fullName ||
    [data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ") ||
    "Astrologer"
  );
}

function getDocumentIds(data: Astrologer, tab: DocumentTab) {
  if (tab === "aadhaar") return data.aadhaarFileUuid ? [data.aadhaarFileUuid] : [];
  if (tab === "education") return data.educationalQualificationFileUuid ? [data.educationalQualificationFileUuid] : [];
  if (tab === "experience") {
    const experienceFiles = data.experienceFiles || [];
    return [
      data.experienceFileUuid,
      ...(data.experienceFileUuids || []),
      ...experienceFiles.map((file) => file.fileId || file.fileUuid || file.publicId)
    ].filter(Boolean) as string[];
  }

  const certificateFiles = data.certificateFiles || [];
  return [
    data.certificateFileUuid,
    ...(data.certificateFileUuids || []),
    ...certificateFiles.map((file) => file.fileId || file.fileUuid || file.publicId)
  ].filter(Boolean) as string[];
}

export function AstrologerProfileScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["astrologer-profile"], queryFn: getAstrologerProfile });
  const [editing, setEditing] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocumentTab>("aadhaar");
  const [form, setForm] = useState<FormState>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");
  const [expertiseDraft, setExpertiseDraft] = useState("");
  const [languageDraft, setLanguageDraft] = useState("");

  useEffect(() => {
    if (profile.data) {
      setForm(makeForm(profile.data));
      setExpertiseDraft("");
      setLanguageDraft("");
    }
  }, [profile.data]);

  const update = useMutation({
    mutationFn: (values: FormState) =>
      updateAstrologerProfile({
        ...values,
        fullName: values.fullName || [values.firstName, values.middleName, values.lastName].filter(Boolean).join(" "),
        expertise: asList(values.expertise),
        languagesKnown: asList(values.languagesKnown),
        consultationModes: asList(values.consultationModes)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["astrologer-profile"] });
      setEditing(false);
      setMessage(t("Profile updated successfully."));
    },
    onError: (err) => setError(getApiErrorMessage(err, "Unable to update profile"))
  });

  const data = form;
  const name = getProfileName(data);
  const completion = Math.max(0, Math.min(100, Number(data.profileCompletionPercentage || 0)));
  const status = data.profileStatus || "APPROVED";
  const activeDocMeta = documentTabs.find((item) => item.key === activeDoc) || documentTabs[0];
  const documentIds = useMemo(() => getDocumentIds(data, activeDoc), [data, activeDoc]);

  const setField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setListField = (key: "expertise" | "languagesKnown" | "consultationModes", values: string[]) => {
    setForm((current) => ({ ...current, [key]: values }));
  };

  const addListValue = (key: "expertise" | "languagesKnown", value: string, clearDraft: () => void) => {
    const nextValue = value.trim();
    if (!nextValue) return;
    const currentValues = asList(form[key]);
    if (!currentValues.some((item) => item.toLowerCase() === nextValue.toLowerCase())) {
      setListField(key, [...currentValues, nextValue]);
    }
    clearDraft();
  };

  const removeListValue = (key: "expertise" | "languagesKnown", value: string) => {
    setListField(key, asList(form[key]).filter((item) => item !== value));
  };

  const toggleConsultationMode = (mode: string) => {
    const currentModes = asList(form.consultationModes);
    const exists = currentModes.includes(mode);
    setListField("consultationModes", exists ? currentModes.filter((item) => item !== mode) : [...currentModes, mode]);
  };

  const submitUpdate = () => {
    if (expertiseDraft.trim()) {
      setError(t("Please add expertise first."));
      return;
    }
    if (languageDraft.trim()) {
      setError(t("Please add language first."));
      return;
    }
    update.mutate(form);
  };

  const downloadDocument = async (fileId: string) => {
    try {
      setDownloadingId(fileId);
      const request = await getDownloadFileRequest(fileId, activeDocMeta.fileType);
      const destination = `${FileSystem.cacheDirectory}${activeDocMeta.fileType}-${fileId}`;
      const result = await FileSystem.downloadAsync(request.url, destination, { headers: request.headers });
      const file = await resolveDownloadedFile(result.uri, result.headers, `${activeDocMeta.fileType}-${fileId}`);
      await saveFileDirectly(file.uri, file.fileName, file.mimeType);
      Alert.alert(t("Download Document"), t("Document downloaded successfully."));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to download document"));
    } finally {
      setDownloadingId("");
    }
  };

  if (profile.isLoading) return <LoadingState label="Loading profile" />;
  if (profile.isError) {
    return (
      <Screen>
        <ErrorState message="Unable to load astrologer profile" onRetry={() => profile.refetch()} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.fixedHeaderSafe}>
        <View style={styles.header}>
          <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>
            {t("Back")}
          </Button>
          <Text style={styles.headerTitle}>{t("Astrologer Profile")}</Text>
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
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: editing ? 132 + insets.bottom : 96 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <Avatar.Text size={76} label={initialsFromName(name) || "AA"} style={styles.avatar} labelStyle={styles.avatarLabel} />
              <View style={styles.heroCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{name}</Text>
                  <Text style={styles.approved}>{t(status)}</Text>
                </View>
                <Text style={styles.location} numberOfLines={1}>
                  {[t(data.specialization || "Astrology"), data.city, data.state].filter(Boolean).join(" · ")}
                </Text>
                <Text style={styles.about} numberOfLines={editing ? 4 : 8}>
                  {data.aboutYourself || data.bio ? t(data.aboutYourself || data.bio || "") : t("No profile description added yet.")}
                </Text>
              </View>
            </View>

            <View style={styles.availabilityCard}>
              <View>
                <Text style={styles.smallLabel}>{t("Availability")}</Text>
                <Text style={styles.statusText}>{data.isOnline === false ? t("Offline") : t("Online")}</Text>
              </View>
              <Switch value={data.isOnline !== false} disabled />
            </View>

            <View style={styles.statsGrid}>
              <Stat label="Status" value={status} />
              <Stat label="Completion" value={`${completion}%`} />
              <Stat label="Experience" value={data.yearsOfExperience ? `${data.yearsOfExperience} ${t("years")}` : "-"} />
              <Stat label="Joined" value={data.dateOfJoining || "-"} />
            </View>

            <View style={styles.completionCard}>
              <View style={styles.progressTop}>
                <Text style={styles.smallLabel}>{t("Profile completion")}</Text>
                <Text style={styles.progressValue}>{completion}%</Text>
              </View>
              <ProgressBar progress={completion / 100} color="#e68a22" style={styles.progress} />
              <Text style={styles.hint}>{t("Profile values are currently available from the account data.")}</Text>
              <Button
                mode="outlined"
                icon="lock-reset"
                onPress={() => router.push("/change-password")}
                style={styles.changePasswordButton}
                labelStyle={styles.changePasswordText}
              >
                {t("Change Password")}
              </Button>
            </View>

            <Section title="Personal Details" subtitle="Core identity shown on the astrologer account.">
              <ProfileInput label="Full Name" value={data.fullName || ""} editable={editing} onChangeText={(value) => setField("fullName", value)} />
              <ProfileInput label="Display Name" value={data.displayName || ""} editable={false} />
              <ProfileInput label="Gender" value={data.gender || ""} editable={editing} translateValue onChangeText={(value) => setField("gender", value)} />
              <ProfileInput label="Date of Birth" value={data.dateOfBirth || ""} editable={editing} onChangeText={(value) => setField("dateOfBirth", value)} />
              <ProfileInput label="Religion" value={data.religion || ""} editable={editing} translateValue onChangeText={(value) => setField("religion", value)} />
              <ProfileInput label="Mother Tongue" value={data.motherTongue || ""} editable={editing} translateValue onChangeText={(value) => setField("motherTongue", value)} />
            </Section>

            <Section title="Contact And Address" subtitle="Contact information and service location.">
              <ProfileInput label="Email" value={data.email || ""} editable={false} />
              <ProfileInput label="Mobile Number" value={data.mobileNo || data.mobileNumber || data.phone || ""} editable={editing} onChangeText={(value) => setField("mobileNo", value)} />
              <ProfileInput label="Address" value={data.address || ""} editable={editing} multiline onChangeText={(value) => setField("address", value)} />
              <ProfileInput label="City" value={data.city || ""} editable={editing} onChangeText={(value) => setField("city", value)} />
              <ProfileInput label="State" value={data.state || ""} editable={editing} onChangeText={(value) => setField("state", value)} />
              <ProfileInput label="Pin Code" value={data.pinCode || ""} editable={editing} onChangeText={(value) => setField("pinCode", value)} />
              <ProfileInput label="Country" value={data.country || ""} editable={editing} translateValue onChangeText={(value) => setField("country", value)} />
            </Section>

            <Section title="Professional Profile" subtitle="Experience, skills, languages, and consultation setup.">
              <ProfileInput label="Specialization" value={data.specialization || ""} editable={editing} translateValue onChangeText={(value) => setField("specialization", value)} />
              <ProfileInput label="Years of Experience" value={asText(data.yearsOfExperience)} editable={editing} onChangeText={(value) => setField("yearsOfExperience", value)} />
              <ProfileInput label="Educational Qualification" value={data.educationalQualification || ""} editable={editing} onChangeText={(value) => setField("educationalQualification", value)} />
              <AddableListInput
                label="Expertise"
                value={expertiseDraft}
                values={asList(data.expertise)}
                editable={editing}
                onChangeText={setExpertiseDraft}
                onAdd={() => addListValue("expertise", expertiseDraft, () => setExpertiseDraft(""))}
                onRemove={(value) => removeListValue("expertise", value)}
              />
              <AddableListInput
                label="Languages Known"
                value={languageDraft}
                values={asList(data.languagesKnown)}
                editable={editing}
                onChangeText={setLanguageDraft}
                onAdd={() => addListValue("languagesKnown", languageDraft, () => setLanguageDraft(""))}
                onRemove={(value) => removeListValue("languagesKnown", value)}
              />
              <ConsultationModeSelector
                values={asList(data.consultationModes)}
                editable={editing}
                onToggle={toggleConsultationMode}
              />
              <ProfileInput label="About Yourself" value={data.aboutYourself || data.bio || ""} editable={editing} translateValue multiline onChangeText={(value) => setField("aboutYourself", value)} />
            </Section>

            <Section title="Documents" subtitle="Download uploaded astrologer verification files.">
              <View style={styles.docTabs}>
                {documentTabs.map((tab) => (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveDoc(tab.key)}
                    style={[styles.docTab, activeDoc === tab.key && styles.docTabActive]}
                  >
                    <Text style={[styles.docTabText, activeDoc === tab.key && styles.docTabTextActive]}>{t(tab.label)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.documentPanel}>
                <Text style={styles.documentTitle}>{t(activeDocMeta.label)}</Text>
                {documentIds.length ? (
                  documentIds.map((fileId, index) => (
                    <View key={`${fileId}-${index}`} style={styles.documentRow}>
                      <View style={styles.documentInfo}>
                        <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.amber} />
                        <Text style={styles.documentId} numberOfLines={1}>{fileId}</Text>
                      </View>
                      <Button
                        mode="outlined"
                        icon="download"
                        compact
                        loading={downloadingId === fileId}
                        onPress={() => downloadDocument(fileId)}
                      >
                        {t("Download")}
                      </Button>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyDoc}>{t("No document uploaded for this section.")}</Text>
                )}
              </View>
            </Section>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {editing ? (
        <View style={[styles.updateBar, { bottom: 56 + insets.bottom }]}>
          <Text style={styles.updateHint}>{t("Edit personal and professional details only.")}</Text>
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

function Stat({ label, value }: { label: string; value: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.statCard}>
      <Text style={styles.smallLabel}>{t(label)}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{t(value)}</Text>
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
  const displayValue = !editable && translateValue && value ? t(value) : value;
  return (
    <TextInput
      label={t(label)}
      value={displayValue}
      editable={editable}
      disabled={!editable}
      onChangeText={onChangeText}
      mode="outlined"
      multiline={multiline}
      dense
      style={[styles.input, multiline && styles.multilineInput]}
      outlineStyle={styles.inputOutline}
      contentStyle={styles.inputContent}
      theme={{ colors: { background: "#fffdf8", primary: colors.amber, outline: colors.border } }}
    />
  );
}

function AddableListInput({
  label,
  value,
  values,
  editable,
  onChangeText,
  onAdd,
  onRemove
}: {
  label: string;
  value: string;
  values: string[];
  editable: boolean;
  onChangeText: (value: string) => void;
  onAdd: () => void;
  onRemove: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.addableWrap}>
      {editable ? (
        <View style={styles.addRow}>
          <TextInput
            label={t(label)}
            value={value}
            onChangeText={onChangeText}
            mode="outlined"
            dense
            style={[styles.input, styles.addInput]}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            theme={{ colors: { background: "#fffdf8", primary: colors.amber, outline: colors.border } }}
          />
          <Button mode="contained-tonal" compact onPress={onAdd} style={styles.addButton}>
            {t("Add")}
          </Button>
        </View>
      ) : (
        <Text style={styles.readOnlyListLabel}>{t(label)}</Text>
      )}
      <TagRow values={values} editable={editable} onRemove={onRemove} />
    </View>
  );
}

function ConsultationModeSelector({
  values,
  editable,
  onToggle
}: {
  values: string[];
  editable: boolean;
  onToggle: (mode: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.checkboxBlock}>
      <Text style={styles.readOnlyListLabel}>{t("Consultation Modes")}</Text>
      <View style={styles.checkboxRow}>
        {["Online", "Offline"].map((mode) => {
          const checked = values.includes(mode);
          return (
            <Pressable
              key={mode}
              disabled={!editable}
              onPress={() => onToggle(mode)}
              style={[styles.checkboxItem, checked && styles.checkboxItemChecked, !editable && styles.checkboxItemDisabled]}
            >
              <Checkbox status={checked ? "checked" : "unchecked"} disabled={!editable} />
              <Text style={styles.checkboxText}>{t(mode)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TagRow({
  values,
  editable,
  onRemove
}: {
  values: string[];
  editable?: boolean;
  onRemove?: (value: string) => void;
}) {
  const { t } = useTranslation();
  if (!values.length) return null;
  return (
    <View style={styles.tags}>
      {values.map((value) => (
        <Chip
          key={value}
          compact
          style={styles.tag}
          textStyle={styles.tagText}
          closeIcon={editable ? "close" : undefined}
          onClose={editable && onRemove ? () => onRemove(value) : undefined}
        >
          {t(value)}
        </Chip>
      ))}
    </View>
  );
}

async function resolveDownloadedFile(sourceUri: string, headers: Record<string, string> | undefined, fallbackName: string) {
  const contentType = getHeader(headers, "content-type").split(";")[0].trim().toLowerCase();
  const dispositionName = getFileNameFromDisposition(getHeader(headers, "content-disposition"));
  const fileBase64 = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64
  });
  const signature = inferFileSignature(fileBase64);
  const mimeType = signature.mimeType || contentType || "application/octet-stream";

  if (mimeType.includes("application/json") || signature.extension === "json") {
    throw new Error(getDownloadErrorMessage(fileBase64));
  }

  const extension = getExtension(dispositionName) || signature.extension || extensionFromMimeType(mimeType) || "bin";
  const fileName = ensureExtension(dispositionName || fallbackName, extension);

  return { uri: sourceUri, fileName, mimeType };
}

async function saveFileDirectly(sourceUri: string, fileName: string, mimeType: string) {
  if (Platform.OS === "android") {
    const initialUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);
    if (!permissions.granted) throw new Error("Storage permission is required to download document.");

    const fileBase64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      mimeType
    );
    await FileSystem.StorageAccessFramework.writeAsStringAsync(destinationUri, fileBase64, {
      encoding: FileSystem.EncodingType.Base64
    });
    return destinationUri;
  }

  const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  return destinationUri;
}

function getHeader(headers: Record<string, string> | undefined, key: string) {
  const match = Object.entries(headers || {}).find(([name]) => name.toLowerCase() === key.toLowerCase());
  return match?.[1] || "";
}

function getFileNameFromDisposition(disposition: string) {
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded.replace(/"/g, ""));

  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return plain ? plain.trim() : "";
}

function inferFileSignature(base64: string) {
  if (base64.startsWith("JVBERi0")) return { extension: "pdf", mimeType: "application/pdf" };
  if (base64.startsWith("/9j/")) return { extension: "jpg", mimeType: "image/jpeg" };
  if (base64.startsWith("iVBORw0KGgo")) return { extension: "png", mimeType: "image/png" };
  if (base64.startsWith("R0lGOD")) return { extension: "gif", mimeType: "image/gif" };
  if (base64.startsWith("UEsDB")) return { extension: "docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
  if (base64.startsWith("ey") || base64.startsWith("W3")) return { extension: "json", mimeType: "application/json" };
  return { extension: "", mimeType: "" };
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("msword")) return "doc";
  if (mimeType.includes("wordprocessingml")) return "docx";
  return "";
}

function getExtension(fileName: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || "";
}

function ensureExtension(fileName: string, extension: string) {
  const cleanName = fileName.replace(/[\\/:*?"<>|]+/g, "-").trim() || "document";
  return getExtension(cleanName) ? cleanName : `${cleanName}.${extension}`;
}

function getDownloadErrorMessage(base64: string) {
  try {
    const text = atob(base64);
    const data = JSON.parse(text) as { errorDescription?: string; message?: string; error?: string };
    return data.errorDescription || data.message || data.error || "Unable to download document.";
  } catch {
    return "Unable to download document.";
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  fixedHeaderSafe: { backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: "#f0dfae", zIndex: 40 },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  content: { gap: spacing.md },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, color: colors.blue, fontSize: 16, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm, zIndex: 45 },
  roundAction: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ffad43", alignItems: "center", justifyContent: "center" },
  roundActionActive: { backgroundColor: "#f7e2b6" },
  heroCard: { flexDirection: "row", gap: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: "#e9c65e", backgroundColor: "#fff8e7", padding: spacing.md },
  avatar: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#f0bf36" },
  avatarLabel: { color: colors.amber, fontWeight: "900" },
  heroCopy: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 19, lineHeight: 24, fontWeight: "900" },
  approved: { color: colors.success, backgroundColor: "#dff5ea", borderRadius: 6, overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, lineHeight: 13, fontWeight: "900" },
  location: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "600" },
  about: { color: colors.cocoa, marginTop: 7, fontSize: 13, lineHeight: 19 },
  availabilityCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  smallLabel: { color: colors.cocoa, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  statusText: { color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: "900" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statCard: { width: "48.5%", minHeight: 66, justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  statValue: { color: colors.ink, marginTop: 4, fontSize: 14, lineHeight: 18, fontWeight: "900" },
  completionCard: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.xs },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressValue: { color: colors.amber, fontSize: 12, fontWeight: "900" },
  progress: { height: 8, borderRadius: 8, backgroundColor: "#f3e1b6" },
  hint: { color: colors.cocoa, fontSize: 11, lineHeight: 15 },
  changePasswordButton: { marginTop: spacing.sm, borderRadius: 6, borderColor: colors.amber },
  changePasswordText: { color: colors.amber, fontWeight: "900" },
  section: { borderRadius: 8, borderWidth: 1, borderColor: "#e9c65e", backgroundColor: colors.surface, padding: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 16, lineHeight: 20, fontWeight: "900" },
  sectionSub: { color: colors.cocoa, marginTop: 3, fontSize: 12, lineHeight: 16 },
  sectionBody: { marginTop: spacing.md, gap: spacing.sm },
  input: { backgroundColor: "#fffdf8", minHeight: 48 },
  multilineInput: { minHeight: 104 },
  inputOutline: { borderColor: "#f0dfae", borderRadius: 6 },
  inputContent: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  addableWrap: { gap: spacing.sm },
  addRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  addInput: { flex: 1, minWidth: 0 },
  addButton: { minWidth: 76, borderRadius: 6 },
  readOnlyListLabel: { color: colors.cocoa, fontSize: 12, lineHeight: 16, fontWeight: "700" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tag: { backgroundColor: "#fff4dd", borderWidth: 1, borderColor: "#efc56d" },
  tagText: { color: colors.amber, fontSize: 11, lineHeight: 14, fontWeight: "700" },
  checkboxBlock: { gap: spacing.sm },
  checkboxRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  checkboxItem: { minHeight: 42, flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: "#efc56d", backgroundColor: "#fffaf0", paddingRight: spacing.md },
  checkboxItemChecked: { backgroundColor: "#fff2d3", borderColor: colors.amber },
  checkboxItemDisabled: { opacity: 0.78 },
  checkboxText: { color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: "800" },
  docTabs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  docTab: { minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: "#efc56d", backgroundColor: "#fffaf0", paddingHorizontal: spacing.sm },
  docTabActive: { backgroundColor: "#fff2d3", borderColor: colors.amber },
  docTabText: { color: colors.ink, fontSize: 11, lineHeight: 14, fontWeight: "800" },
  docTabTextActive: { color: colors.amber },
  documentPanel: { borderTopWidth: 1, borderTopColor: "#f0dfae", marginTop: spacing.xs, paddingTop: spacing.md, gap: spacing.sm },
  documentTitle: { color: colors.ink, fontSize: 13, lineHeight: 17, fontWeight: "900" },
  documentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  documentInfo: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  documentId: { flex: 1, minWidth: 0, color: colors.cocoa, fontSize: 12, lineHeight: 16 },
  emptyDoc: { color: colors.cocoa, fontSize: 13, lineHeight: 18 },
  updateBar: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#fffaf0", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, zIndex: 30 },
  updateHint: { color: colors.cocoa, fontSize: 12, lineHeight: 16 },
  updateButton: { borderRadius: 6, backgroundColor: colors.amber },
  updateButtonText: { color: "#fff", fontWeight: "900" },
  errorSnack: { backgroundColor: colors.danger }
});
