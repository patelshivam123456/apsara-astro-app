import { PropsWithChildren, useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";

import { useFeatureAccess } from "@/components/SubscriptionGate";

export function NumerologyAccess({ children }: PropsWithChildren) {
  const requireFeature = useFeatureAccess();
  const [status, setStatus] = useState("loading");
  useFocusEffect(useCallback(() => {
    let mounted = true;
    setStatus("loading");
    void requireFeature("numerology").then((allowed) => {
      if (mounted) setStatus(allowed ? "allowed" : "denied");
    });
    return () => { mounted = false; };
  }, [requireFeature]));
  if (status === "allowed") return <>{children}</>;
  return <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
    {status === "loading" ? <ActivityIndicator /> : <>
      <Button onPress={() => router.canGoBack() ? router.back() : router.replace("/astrologer")}>Back</Button>
      <Button onPress={() => { void requireFeature("numerology").then((allowed) => { if (allowed) setStatus("allowed"); }); }}>Check Access</Button>
    </>}
  </View>;
}
