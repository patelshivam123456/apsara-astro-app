import { useState } from "react";
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { Button, Dialog, HelperText, Portal, Snackbar, Text, TextInput } from "react-native-paper";
import { z } from "zod";

import { Screen } from "@/components/Screen";
import { OtpVerificationDialog } from "@/components/OtpVerificationDialog";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { forgotPassword, generateOtp } from "@/services/auth.service";
import { getApiErrorMessage } from "@/services/apiClient";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  username: z.string().min(1, "Username is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type FormValues = z.infer<typeof schema>;

export function LoginScreen() {
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [message, setMessage] = useState("");
  const [registerChoiceOpen, setRegisterChoiceOpen] = useState(false);
  const [loginChannel, setLoginChannel] = useState<"email" | "mobileNo">("email");
  const [mobileNo, setMobileNo] = useState("");
  const [otp, setOtp] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [mobileSubmitting, setMobileSubmitting] = useState(false);

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
      await signIn(values.username, values.password, "email");
      router.replace("/astrologer");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    }
  });

  const submitMobile = async () => {
    if (!/^\d{10}$/.test(mobileNo)) { setError("Mobile number must be 10 digits."); return; }
    try {
      setMobileSubmitting(true);
      await generateOtp(mobileNo, "mobileNo");
      setOtpOpen(true);
      setError("");
    } catch (err) { setError(getApiErrorMessage(err, "Unable to send OTP")); }
    finally { setMobileSubmitting(false); }
  };

  const submitMobileOtp = async () => {
    if (!/^\d{6}$/.test(otp)) { setError("Enter the 6 digit OTP."); return; }
    try {
      setMobileSubmitting(true);
      await signIn(mobileNo, "", "mobileNo", otp);
      setOtpOpen(false);
      router.replace("/astrologer");
    } catch (err) { setError(getApiErrorMessage(err, "Login failed")); }
    finally { setMobileSubmitting(false); }
  };

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Home")}
        style={styles.homeButton}
        onPress={() => router.replace("/astrologer")}
      >
        <MaterialCommunityIcons name="home" size={24} color={colors.ink} />
      </Pressable>
      <View style={styles.topCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 4,width: "30%" }}>
        <Image
          source={require("@/assets/new_logo_apsara.jpeg")}
          resizeMode="contain"
          style={styles.logo}
        />
</View>
        {/* <Text style={styles.kicker}>APSARAASTRO</Text> */}
<View>
        <Text variant="headlineSmall" style={styles.mainTitle}>
          {forgotOpen ? t("Reset Password") : t("Welcome back ApsraAstro")}
        </Text>

        <Text style={styles.muted}>
          {forgotOpen
            ? t("Enter your registered email to receive reset password instructions.")
            : t("Enter your username and password to login")}
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
          <Text style={styles.stepLabel}>{t("LOGIN")}</Text>

          <View style={styles.channelChoices}>
            <Pressable accessibilityRole="button" onPress={() => setLoginChannel("email")} style={[styles.channelChoice, loginChannel === "email" && styles.channelChoiceActive]}>
              <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.channelChoiceText, loginChannel === "email" && styles.channelChoiceTextActive]}>{t("Login with email")}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setLoginChannel("mobileNo")} style={[styles.channelChoice, loginChannel === "mobileNo" && styles.channelChoiceActive]}>
              <Text numberOfLines={2} adjustsFontSizeToFit style={[styles.channelChoiceText, loginChannel === "mobileNo" && styles.channelChoiceTextActive]}>{t("Login with mobile")}</Text>
            </Pressable>
          </View>

          {loginChannel === "email" ? <Controller
            control={control}
            name="username"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  label={t("Username")}
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
          /> : <TextInput
            label={t("Mobile Number")}
            value={mobileNo}
            onChangeText={(value) => setMobileNo(value.replace(/\D/g, "").slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={10}
            mode="outlined"
            theme={inputTheme}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />}

          {loginChannel === "email" ? <Controller
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
          /> : null}

          {error ? <HelperText type="error" visible>{t(error)}</HelperText> : null}

          <Button
            mode="contained"
            loading={loginChannel === "email" ? formState.isSubmitting : mobileSubmitting}
            onPress={loginChannel === "email" ? onSubmit : submitMobile}
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnText}
          >
            {loginChannel === "email" ? t("Login") : t("Submit")}
          </Button>

          <Button mode="text" onPress={() => setForgotOpen(true)}>
            {t("Forgot Password")}
          </Button>

          <TouchableOpacity style={styles.registerPrompt} onPress={() => setRegisterChoiceOpen(true)}>
            <Text style={styles.registerPromptText}>
              {t("Don't have an account?")}{" "}
              <Text style={styles.registerPromptLink}>{t("Register Now")}</Text>
            </Text>
          </TouchableOpacity>

        </View>

      )}
</View>
      <Portal>
        <OtpVerificationDialog
          visible={otpOpen}
          recipient={`+91 ${mobileNo}`}
          value={otp}
          onChange={setOtp}
          loading={mobileSubmitting}
          onCancel={() => { setOtpOpen(false); setOtp(""); }}
          onSubmit={submitMobileOtp}
        />
        <Dialog visible={registerChoiceOpen} onDismiss={() => setRegisterChoiceOpen(false)}>
          <Dialog.Title>{t("Choose Registration Type")}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.choiceList}>
              <Button
                mode="contained"
                style={styles.primaryBtn}
                labelStyle={styles.primaryBtnText}
                onPress={() => {
                  setRegisterChoiceOpen(false);
                  router.push({ pathname: "/(auth)/register", params: { type: "astrologer" } });
                }}
              >
                {t("Register as an Astrologer")}
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setRegisterChoiceOpen(false);
                  router.push({ pathname: "/(auth)/register", params: { type: "client" } });
                }}
              >
                {t("Register as a Client")}
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
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

  homeButton: { alignSelf: "flex-end", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },

  stepLabel: {
    color: "#b94717",
    fontWeight: "900"
  },

  channelChoices: { flexDirection: "row", gap: 8, width: "100%" },
  channelChoice: { flex: 1, minWidth: 0, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 28, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  channelChoiceActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  channelChoiceText: { color: colors.cocoa, fontWeight: "700", fontSize: 13, textAlign: "center" },
  channelChoiceTextActive: { color: colors.surface },

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
  },

  registerPrompt: {
    alignItems: "center",
    paddingVertical: 4
  },

  registerPromptText: {
    color: colors.cocoa,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  },

  registerPromptLink: {
    color: "#b94717",
    fontSize: 12,
    fontWeight: "900"
  },

  choiceList: {
    gap: spacing.md
  }
});
