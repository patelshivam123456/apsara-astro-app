import { PropsWithChildren, useEffect } from "react";
import { View } from "react-native";
import { router, usePathname } from "expo-router";
import { Button, Dialog, Portal, Text } from "react-native-paper";

import { getUserPublicId } from "@/utils/user";
import { useAuthStore } from "@/store/auth.store";
import {
  getTrialInfo,
  isSubscriptionActive,
  useSubscriptionStore
} from "@/store/subscription.store";

const exemptRoutes = [
  "/",
  "/onboarding",
  "/subscription-plan",
  "/payment-success",
  "/payment-failed",
  "/(auth)/login",
  "/(auth)/register",
  "/(auth)/reset-password"
];

export function SubscriptionGate({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isAuthLoaded = useAuthStore((state) => state.isAuthLoaded);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const userPublicId = getUserPublicId(user, accessToken);
  const ensureTrial = useSubscriptionStore((state) => state.ensureTrial);
  const trial = useSubscriptionStore((state) => state.trials[userPublicId]);
  const subscription = useSubscriptionStore((state) => state.subscriptions[userPublicId]);
  const trialInfo = getTrialInfo(trial);
  const subscriptionActive = isSubscriptionActive(subscription);
  const routeExempt = exemptRoutes.some((route) => pathname === route || pathname.startsWith("/(auth)"));
  const shouldBlock = Boolean(
    isAuthLoaded &&
      isLoggedIn &&
      userPublicId &&
      !routeExempt &&
      !trialInfo.trialActive &&
      !subscriptionActive
  );

  useEffect(() => {
    if (isLoggedIn && userPublicId) ensureTrial(userPublicId);
  }, [ensureTrial, isLoggedIn, userPublicId]);

  return (
    <>
      {children}
      <Portal>
        <Dialog visible={shouldBlock} dismissable={false}>
          <Dialog.Icon icon="lock-alert" />
          <Dialog.Title>Subscription Required</Dialog.Title>
          <Dialog.Content>
            <View style={{ gap: 8 }}>
              <Text>
                Your free trial has ended. Please choose a subscription plan to continue using Apsra
                Astro.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button mode="contained" onPress={() => router.replace("/subscription-plan")}>
              Purchase Plan
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
