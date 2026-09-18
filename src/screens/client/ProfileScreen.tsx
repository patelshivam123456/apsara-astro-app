import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Text, TextInput } from "react-native-paper";

import { Screen } from "@/components/Screen";
import { LoadingState } from "@/components/StateViews";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { colors, spacing } from "@/constants/theme";
import { useTranslation } from "@/context/LanguageContext";
import { useClientProfile, useUpdateClientProfile } from "@/hooks/useProfile";
import { useAuthStore } from "@/store/auth.store";
import { getUserPublicId } from "@/utils/user";

export function ProfileScreen() {
  const { t } = useTranslation();
  const signOut = useAuthStore((state) => state.signOut);
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const profile = useClientProfile();
  const update = useUpdateClientProfile();
  const data = profile.data || {};
  const userPublicId = getUserPublicId(authUser || data, accessToken);

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (profile.isLoading) return <LoadingState label="Loading profile" />;

  return (
    <Screen>
      <View style={styles.card}>
        <Text variant="headlineSmall" style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.72}>{t("Profile")}</Text>
        {userPublicId ? <SubscriptionStatusCard userPublicId={userPublicId} compact /> : null}
        <TextInput label={t("First Name")} value={data.firstName || ""} disabled />
        <TextInput label={t("Email")} value={data.email || ""} disabled />
        <TextInput label={t("Mobile")} value={data.mobileNo || data.phone || ""} disabled />
        <TextInput label={t("Birth Place")} value={data.placeOfBirth || ""} disabled />
        <Button mode="outlined" loading={update.isPending} onPress={() => update.mutate(data)}>{t("Refresh Profile")}</Button>
        <Button mode="contained-tonal" onPress={handleLogout}>{t("Logout")}</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.md },
  title: { color: colors.ink, lineHeight: 30 }
});
