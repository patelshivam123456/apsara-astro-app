import { useEffect, useState } from "react";
import { router } from "expo-router";

import { LoadingState } from "@/components/StateViews";
import { hasCompletedOnboarding } from "@/services/storage";
import { useAuthStore } from "@/store/auth.store";

export default function Index() {
  const { isAuthLoaded } = useAuthStore();
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);

  useEffect(() => {
    async function route() {
      const done = await hasCompletedOnboarding();
      if (!done) {
        router.replace("/onboarding");
        return;
      }
      if (!isAuthLoaded) return;
      router.replace("/astrologer");
    }

    route().finally(() => setCheckedOnboarding(true));
  }, [isAuthLoaded]);

  return <LoadingState label={checkedOnboarding ? "Opening ApsraAstro" : "Preparing"} />;
}
