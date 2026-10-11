import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Dialog, HelperText, Portal, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguageSelector } from "@/components/LanguageSelector";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { getApiErrorMessage } from "@/services/apiClient";
import { updatePassword } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { decodeAccessToken } from "@/utils/jwt";

export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const signOut = useAuthStore((state) => state.signOut);
  const email = useMemo(() => user?.email || decodeAccessToken(accessToken)?.sub || "", [accessToken, user]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureCurrent, setSecureCurrent] = useState(true);
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const inputTheme = {
    colors: {
      background: "#fffaf0",
      primary: "#b6f000",
      outline: "#ead27a"
    }
  };

  useEffect(() => {
    if (!successOpen) return undefined;
    if (countdown <= 0) {
      goToLogin();
      return undefined;
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, successOpen]);

  const goToLogin = async () => {
    setSuccessOpen(false);
    await signOut();
    router.replace("/(auth)/login");
  };

  const validate = () => {
    if (!email.trim()) return "Email is required.";
    if (!currentPassword.trim()) return "Current password is required.";
    if (newPassword.length < 6) return "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword) return "New password and confirm password must match.";
    if (currentPassword === newPassword) return "New password must be different from current password.";
    return "";
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await updatePassword(email, currentPassword, newPassword);
      setCountdown(3);
      setSuccessOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to change password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.fixedHeaderSafe}>
        <View style={styles.header}>
          <Button mode="text" icon="arrow-left" compact onPress={() => router.back()}>
            {t("Back")}
          </Button>
          <Text style={styles.headerTitle}>{t("Change Password")}</Text>
          <View style={styles.headerActions}>
            <LanguageSelector />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.stepLabel}>{t("SECURITY")}</Text>
          <Text style={styles.subtitle}>{t("Update your account password securely.")}</Text>

          <TextInput
            label={t("Email")}
            value={email}
            disabled
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />
          <TextInput
            label={t("Current Password")}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={secureCurrent}
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            right={<TextInput.Icon icon={secureCurrent ? "eye" : "eye-off"} onPress={() => setSecureCurrent((value) => !value)} />}
          />
          <TextInput
            label={t("New Password")}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={secureNew}
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            right={<TextInput.Icon icon={secureNew ? "eye" : "eye-off"} onPress={() => setSecureNew((value) => !value)} />}
          />
          <TextInput
            label={t("Confirm New Password")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirm}
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
            right={<TextInput.Icon icon={secureConfirm ? "eye" : "eye-off"} onPress={() => setSecureConfirm((value) => !value)} />}
          />

          {error ? <HelperText type="error" visible>{t(error)}</HelperText> : null}

          <Button mode="contained" loading={loading} disabled={loading} onPress={submit} style={styles.primaryBtn} labelStyle={styles.primaryBtnText}>
            {t("Submit")}
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={successOpen} dismissable={false} style={styles.dialog}>
          <Dialog.Icon icon="check-circle" color={colors.success} />
          <Dialog.Title>{t("Password Changed Successfully")}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.subtitle}>
              {t("Congratulations, your password has been updated successfully. Please sign in again with your new password.")}
            </Text>
            <Text style={styles.countdown}>
              {t("Redirecting to login in")} {countdown} {t(countdown === 1 ? "second" : "seconds")}.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={goToLogin} style={styles.primaryBtn} labelStyle={styles.primaryBtnText}>
              {t("Go to Login")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  fixedHeaderSafe: { backgroundColor: colors.cream, borderBottomWidth: 1, borderBottomColor: "#f0dfae", zIndex: 40 },
  header: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, gap: spacing.sm },
  headerTitle: { flex: 1, minWidth: 0, color: colors.blue, fontSize: 16, lineHeight: 20, fontWeight: "900", textAlign: "center" },
  headerActions: { width: 72, flexDirection: "row", justifyContent: "flex-end", zIndex: 45 },
  page: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md
  },
  card: {
    borderRadius: 12,
    borderColor: "#ead27a",
    borderWidth: 1,
    backgroundColor: "#fffaf0",
    padding: spacing.lg,
    gap: spacing.sm
  },
  subtitle: { color: colors.cocoa, lineHeight: 22, fontSize: 13 },
  stepLabel: { color: "#b94717", fontWeight: "900" },
  input: { backgroundColor: "transparent" },
  inputOutline: { borderRadius: 12 },
  inputContent: { paddingVertical: 2 },
  primaryBtn: { borderRadius: 14, backgroundColor: colors.lime },
  primaryBtnText: { color: colors.ink, fontWeight: "900" },
  dialog: { borderRadius: 12, backgroundColor: "#fffdf8" },
  countdown: { color: "#b94717", fontWeight: "900", marginTop: spacing.md }
});
