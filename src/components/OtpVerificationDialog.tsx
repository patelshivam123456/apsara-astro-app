import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Text, TextInput } from "react-native-paper";

import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";

type OtpVerificationDialogProps = {
  visible: boolean;
  recipient: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  loading?: boolean;
  description?: string;
  helperText?: string;
  onResend?: () => void;
  resendLoading?: boolean;
};

export function OtpVerificationDialog({
  visible,
  recipient,
  value,
  onChange,
  onCancel,
  onSubmit,
  loading = false,
  description = "Enter the OTP sent to",
  helperText = "Didn't get OTP or try other username?",
  onResend,
  resendLoading = false
}: OtpVerificationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog visible={visible} dismissable={false} style={styles.dialog}>
      <Dialog.Content style={styles.content}>
        <Text style={styles.brand}>{t("ApsraAstro Verification")}</Text>
        <Text variant="headlineSmall" style={styles.title}>{t("OTP Verification")}</Text>
        <Text style={styles.description}>
          {t(description)} <Text style={styles.recipient}>{recipient}</Text>
        </Text>
        <OtpCodeBoxes value={value} onChange={onChange} disabled={loading} />
        <View style={styles.helperRow}>
          <Text style={styles.helper}>{t(helperText)}</Text>
          {onResend ? (
            <Button compact mode="text" loading={resendLoading} disabled={loading || resendLoading} onPress={onResend} textColor={colors.amber}>
              {t("Resend OTP")}
            </Button>
          ) : null}
        </View>
      </Dialog.Content>
      <Dialog.Actions style={styles.actions}>
        <Button mode="text" disabled={loading} onPress={onCancel} textColor={colors.amber}>
          {t("Cancel")}
        </Button>
        <Button mode="contained" loading={loading} disabled={loading} onPress={onSubmit} style={styles.submit} labelStyle={styles.submitLabel}>
          {t("Submit")}
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

function OtpCodeBoxes({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const refs = useRef<Array<React.ComponentRef<typeof TextInput> | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const updateDigit = (index: number, text: string) => {
    const numeric = text.replace(/\D/g, "");
    const nextDigits = value.padEnd(6, " ").slice(0, 6).split("");
    if (numeric.length > 1) {
      const pasted = numeric.slice(0, 6);
      const nextValue = pasted.length === 6
        ? pasted
        : [...nextDigits.slice(0, index), ...pasted.split(""), ...nextDigits.slice(index + pasted.length)].join("").replace(/\s/g, "").slice(0, 6);
      onChange(nextValue);
      refs.current[Math.min(index + pasted.length, 5)]?.focus();
      return;
    }

    nextDigits[index] = numeric || " ";
    onChange(nextDigits.join("").replace(/\s/g, ""));
    if (numeric && index < 5) refs.current[index + 1]?.focus();
  };

  const handleBackspace = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index].trim() && index > 0) refs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.codeRow}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref: React.ComponentRef<typeof TextInput> | null) => { refs.current[index] = ref; }}
          value={digit.trim()}
          onChangeText={(text) => updateDigit(index, text)}
          onKeyPress={({ nativeEvent }) => handleBackspace(index, nativeEvent.key)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          importantForAutofill="yes"
          disabled={disabled}
          mode="outlined"
          style={styles.codeBox}
          contentStyle={styles.codeContent}
          outlineStyle={styles.codeOutline}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dialog: { width: "92%", maxWidth: 440, alignSelf: "center", borderRadius: 24, backgroundColor: colors.surface, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  brand: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: "900", marginBottom: spacing.lg },
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "900", marginBottom: spacing.xs },
  description: { color: colors.cocoa, fontSize: 16, lineHeight: 24 },
  recipient: { color: "#a8c900", fontWeight: "900" },
  codeRow: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginTop: spacing.lg, marginBottom: spacing.md },
  codeBox: { flex: 1, minWidth: 0, height: 64, backgroundColor: "transparent" },
  codeContent: { textAlign: "center", fontSize: 20, fontWeight: "800", paddingHorizontal: 0, paddingVertical: 0 },
  codeOutline: { borderRadius: 10, borderColor: "#d8c98a" },
  helperRow: { gap: spacing.xs, marginTop: spacing.xs },
  helper: { color: "#6a6400", fontSize: 15, lineHeight: 21, fontWeight: "900" },
  actions: { justifyContent: "flex-end", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  submit: { borderRadius: 28, backgroundColor: colors.lime, minHeight: 48, justifyContent: "center" },
  submitLabel: { color: colors.ink, fontSize: 16, fontWeight: "900", paddingHorizontal: spacing.md }
});
