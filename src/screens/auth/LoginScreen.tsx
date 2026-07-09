import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, HelperText, Snackbar, Text, TextInput } from "react-native-paper";
import { z } from "zod";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { forgotPassword } from "@/services/auth.service";
import { getApiErrorMessage } from "@/services/apiClient";
import { useAuthStore } from "@/store/auth.store";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const schema = z.object({
  username: z.string().min(1, "Username is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);
  const roles = useAuthStore((state) => state.roles);
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [message, setMessage] = useState("");

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" }
  });

  const inputTheme = {
    colors: {
      background: "#fffaf0",
      primary: "#b6f000",
      outline: "#ead27a"
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setError("");
    try {
      await signIn(values.username, values.password);
      const nextRoles = useAuthStore.getState().roles.length ? useAuthStore.getState().roles : roles;
      router.replace(nextRoles.includes("ROLE_ASTROLOGER") ? "/astrologer" : "/(drawer)/(tabs)");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    }
  });

  const sendReset = async () => {
    if (!forgotEmail.trim()) {
      setError("Username is required");
      return;
    }
    try {
      setSendingReset(true);
      await forgotPassword(forgotEmail.trim());
      setForgotOpen(false);
      setForgotEmail("");
      setMessage("Reset password email sent successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to send reset email"));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <View style={styles.topCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4,width: "30%" }}>
        <Image
          source={require("@/assets/logo_apsara.jpeg")}
          resizeMode="contain"
          style={styles.logo}
        />
</View>
        {/* <Text style={styles.kicker}>APSARAASTRO</Text> */}
<View>
        <Text variant="headlineSmall" style={styles.mainTitle}>
          {forgotOpen ? t("Reset Password") : t("Astrologer Login")}
        </Text>

        <Text style={styles.muted}>
          {forgotOpen
            ? t("Enter your registered email to receive reset password instructions.")
            : t("Access your astrologer workspace.")}
        </Text>
        </View>
        </View>
      </View>

      {forgotOpen ? (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>{t("Forgot password")}</Text>

          <TextInput
            label={t("Email")}
            value={forgotEmail}
            onChangeText={setForgotEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />

          {error ? <HelperText type="error" visible>{t(error)}</HelperText> : null}

          <Button
            mode="contained"
            loading={sendingReset}
            onPress={sendReset}
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnText}
          >
            {t("Send Reset Link")}
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setForgotOpen(false);
              setError("");
            }}
          >
            {t("Back to Login")}
          </Button>
        </View>
      ) : (
        
        <View style={styles.card}>
          <Text style={styles.stepLabel}>{t("Login account")}</Text>

          <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  label={t("Email")}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={field.value}
                  onChangeText={field.onChange}
                  mode="outlined"
                  theme={inputTheme}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  contentStyle={styles.inputContent}
                />
                {fieldState.error?.message?<HelperText type="error" visible={!!fieldState.error}>
                  {t(fieldState.error?.message)}
                </HelperText>:null}
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  label={t("Password")}
                  value={field.value}
                  onChangeText={field.onChange}
                  secureTextEntry={secure}
                  mode="outlined"
                  theme={inputTheme}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  contentStyle={styles.inputContent}
                  right={
                    <TextInput.Icon
                      icon={secure ? "eye" : "eye-off"}
                      onPress={() => setSecure((value) => !value)}
                    />
                  }
                />
                {fieldState.error?.message?<HelperText type="error" visible={!!fieldState.error}>
                  {t(fieldState.error?.message)}
                </HelperText>:null}
              </>
            )}
          />

          {error ? <HelperText type="error" visible>{t(error)}</HelperText> : null}

          <Button
            mode="contained"
            loading={formState.isSubmitting}
            onPress={onSubmit}
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnText}
          >
            {t("Login")}
          </Button>

          <Button mode="text" onPress={() => setForgotOpen(true)}>
            {t("Forgot Password")}
          </Button>

          <Button mode="outlined" onPress={() => router.push("/(auth)/register")}>
            {t("Create Astrologer Account")}
          </Button>

        </View>

      )}
</View>
      <Snackbar visible={!!message} onDismiss={() => setMessage("")} duration={3500}>
        {t(message)}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: "100%",
    height: 80,
    borderRadius: 100, 
  },
content: {
  flexGrow: 1,
  padding: spacing.lg,
  gap: spacing.md,
  paddingBottom: 24,
},
  topCard: {
    borderRadius: 12,
    backgroundColor: "#fffaf0",
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#ead27a",
    gap: spacing.xs,
    marginBottom: spacing.md
  },

  kicker: {
    color: "#b94717",
    fontSize: 12,
    fontWeight: "900"
  },

  mainTitle: {
    color: colors.ink,
    fontWeight: "900"
  },

  muted: {
    color: colors.cocoa,
    lineHeight: 22,
    fontSize: 13
  },

  card: {
    borderRadius: 12,
    borderColor: "#ead27a",
    borderWidth: 1,
    backgroundColor: "#fffaf0",
    padding: spacing.lg,
    gap: spacing.sm
  },

  stepLabel: {
    color: "#b94717",
    fontWeight: "900"
  },

  input: {
    backgroundColor: "transparent"
  },

  inputOutline: {
    borderRadius: 12
  },

  inputContent: {
    paddingVertical: 2
  },

  primaryBtn: {
    borderRadius: 14,
    backgroundColor: "#b6f000"
  },

  primaryBtnText: {
    color: "#111",
    fontWeight: "900"
  }
});
