import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "@/context/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="astrologer" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="astrologers" />
        <Stack.Screen name="feature/[name]" />
      </Stack>
    </AppProviders>
  );
}
