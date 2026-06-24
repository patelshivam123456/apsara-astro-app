import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { colors, spacing } from "@/constants/theme";
import { useClientProfile, useUpdateClientProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/auth.store";

export function ProfileScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useClientProfile();
  const update = useUpdateClientProfile();
  const data = profile.data || {};

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (profile.isLoading) return <LoadingState label="Loading profile" />;

  return (
    <Screen>
      <View style={styles.card}>
        <Text variant="headlineSmall">Profile</Text>
        <TextInput label="First Name" value={data.firstName || ""} disabled />
        <TextInput label="Email" value={data.email || ""} disabled />
        <TextInput label="Mobile" value={data.mobileNo || data.phone || ""} disabled />
        <TextInput label="Birth Place" value={data.placeOfBirth || ""} disabled />
        <Button mode="outlined" loading={update.isPending} onPress={() => update.mutate(data)}>Refresh Profile</Button>
        <Button mode="contained-tonal" onPress={handleLogout}>Logout</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md }
});
