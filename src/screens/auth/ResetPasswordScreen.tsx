import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, HelperText, Text, TextInput } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { getApiErrorMessage } from "@/services/apiClient";
import { resetPassword } from "@/services/auth.service";

export function ResetPasswordScreen() {
  const { resetToken = "" } = useLocalSearchParams<{ resetToken?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!resetToken || password.length < 6 || password !== confirmPassword) {
      setError("Enter a valid reset token and matching password.");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(resetToken, password);
      router.replace("/(auth)/login");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to reset password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.card}>
        <Text variant="headlineSmall">Reset Password</Text>
        <TextInput label="New Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        {error ? <HelperText type="error" visible>{error}</HelperText> : null}
        <Button mode="contained" loading={loading} onPress={submit}>Change Password</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }
});
