import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Portal, Text } from "react-native-paper";

import { canUseSubscriptionFeature, getMyEntitlements, getPaymentErrorMessage } from "@/services/subscription.service";
import { useAuthStore } from "@/store/auth.store";
import { getUserPublicId } from "@/utils/user";

type Feature = "numerology" | "kundaliDownload";
const FeatureAccessContext = createContext<(feature: Feature) => Promise<boolean>>(async () => false);

export function useFeatureAccess() {
  return useContext(FeatureAccessContext);
}

export function SubscriptionGate({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [popup, setPopup] = useState<{ error?: string } | null>(null);
  const requireFeature = useCallback(async (feature: Feature) => {
    const { user, accessToken, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !accessToken) {
      router.push("/(auth)/login");
      return false;
    }
    try {
      const entitlement = await queryClient.fetchQuery({
        queryKey: ["feature-entitlements", getUserPublicId(user, accessToken)],
        queryFn: getMyEntitlements,
        staleTime: 0
      });
      // Ignore a check completed after logout/account switching.
      if (useAuthStore.getState().accessToken !== accessToken) return false;
      if (canUseSubscriptionFeature(entitlement, feature)) return true;
      setPopup({});
    } catch (error) {
      setPopup({ error: getPaymentErrorMessage(error, "Unable to check plan access. Please try again.") });
    }
    return false;
  }, [queryClient]);

  return (
    <FeatureAccessContext.Provider value={requireFeature}>
      {children}
      <Portal>
        <Dialog visible={popup !== null} onDismiss={() => setPopup(null)}>
          <Dialog.Title>{popup?.error ? "Unable to check access" : "You have no active plan"}</Dialog.Title>
          <Dialog.Content>
            <View><Text>{popup?.error ?? "Upgrade your plan to use this feature."}</Text></View>
          </Dialog.Content>
          <Dialog.Actions>
            {!popup?.error ? <Button onPress={() => { setPopup(null); router.push("/subscription-plan"); }}>Upgrade Plan</Button> : null}
            <Button onPress={() => setPopup(null)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </FeatureAccessContext.Provider>
  );
}
