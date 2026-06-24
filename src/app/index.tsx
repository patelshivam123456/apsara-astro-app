import { useEffect, useState } from "react";
import { router } from "expo-router";

import { LoadingState } from "@/components/StateViews";
import { hasCompletedOnboarding } from "@/services/storage";
import { useAuthStore } from "@/store/auth.store";

export default function Index() {
  const { isAuthLoaded, isLoggedIn, roles } = useAuthStore();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  useEffect(() => {
    async function route() {
      const done = await hasCompletedOnboarding();
      if (!done) {
        router.replace("/onboarding");
        return;
      }
      if (!isAuthLoaded) return;
      if (!isLoggedIn) router.replace({ pathname: "/(auth)/login", params: { mode: "astrologer" } });
      else router.replace(roles.includes("ROLE_ASTROLOGER") ? "/astrologer" : "/(drawer)/(tabs)");
    }

    route().finally(() => setCheckedOnboarding(true));
  }, [isAuthLoaded, isLoggedIn, roles]);

  return <LoadingState label={checkedOnboarding ? "Opening ApsaraAstro" : "Preparing"} />;
}
