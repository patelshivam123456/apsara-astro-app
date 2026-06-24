import { useLocalSearchParams } from "expo-router";

import { FeatureListScreen } from "@/components/FeatureListScreen";

export function GenericFeatureScreen() {
  const { name = "Apsara Service" } = useLocalSearchParams<{ name?: string }>();
  const title = decodeURIComponent(name);
  return (
    <FeatureListScreen
      title={title}
      subtitle="This mobile module is routed and ready for the matching backend workflow from ApsaraAstro."
      items={["Saved requests", "Secure wallet flow", "Notifications", "Order history"]}
    />
  );
}
