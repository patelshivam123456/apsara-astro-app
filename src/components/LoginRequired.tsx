import { useEffect, type ReactNode } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { useAuthStore } from "@/store/auth.store";

export function LoginRequired({ children }: { children: ReactNode }) {
  const isAuthLoaded = useAuthStore((state) => state.isAuthLoaded);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  useEffect(() => {
    if (!isAuthLoaded || isLoggedIn) return;

    Alert.alert("Please login first", "Please login first to use this feature.", [
      { text: "Close", style: "cancel", onPress: () => router.replace("/astrologer") },
      { text: "OK", onPress: () => router.replace({ pathname: "/(auth)/login", params: { mode: "astrologer" } }) }
    ], { cancelable: false });
  }, [isAuthLoaded, isLoggedIn]);

  if (!isAuthLoaded || !isLoggedIn) return null;
  return <>{children}</>;
}
