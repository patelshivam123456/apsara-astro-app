import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/context/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="kundali-pdf" />
        <Stack.Screen name="kundali-pdf-result" />
        <Stack.Screen name="match-making-pdf" />
        <Stack.Screen name="match-making-pdf-result" />
        <Stack.Screen name="apsara-astro-profile" />
        <Stack.Screen name="apsara-astro-profile-result" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="feature/[name]" />
      </Stack>
    </AppProviders>
  );
}
